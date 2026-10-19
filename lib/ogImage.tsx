import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import profile from "@/content/profile.json";
import config from "@/content/config.json";

/** Shared size/type exports for every opengraph-image route. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ACCENT = "#20afc8";
const BACKGROUND = "#0a1b2b";
const FOREGROUND = "#f5f9fc";
const MUTED = "#8fa6b8";

type Weight = 400 | 700;
interface Font {
  name: string;
  data: ArrayBuffer;
  weight: Weight;
  style: "normal";
}

/**
 * Fetches just the glyphs `text` needs from Google Fonts (TrueType, which the OG renderer
 * reads). Returns null when offline — the image then uses the renderer's built-in font.
 */
async function googleFont(family: string, weight: Weight, text: string): Promise<Font | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await (await fetch(url)).arrayBuffer();
    return { name: family, data, weight, style: "normal" };
  } catch {
    return null;
  }
}

let avatarPromise: Promise<string | null> | null = null;

/** The profile photo as a small PNG data URL (the OG renderer can't read WebP). */
function avatar(): Promise<string | null> {
  avatarPromise ??= (async () => {
    try {
      const file = await readFile(path.join(process.cwd(), "public", profile.avatar));
      const png = await sharp(file).resize(160, 160, { fit: "cover" }).png().toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    } catch {
      return null;
    }
  })();
  return avatarPromise;
}

/** A cover image (any format) as a PNG data URL sized for the card, or null if unreadable. */
async function coverImage(publicPath: string | undefined): Promise<string | null> {
  if (!publicPath?.startsWith("/images/")) return null;
  try {
    const file = await readFile(path.join(process.cwd(), "public", decodeURI(publicPath)));
    const png = await sharp(file).resize(440, 440, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Cover-led card for titles the renderer can't shape: big cover, kind label and author. */
async function renderCoverCard(kind: string, picture: string) {
  const site = config.siteUrl.replace(/^https?:\/\//, "");
  const text = `${kind.toUpperCase()}${profile.name}${site}`;
  const fonts = (await Promise.all([googleFont("Inter", 700, text), googleFont("Inter", 400, text)])).filter(
    (font): font is Font => font !== null
  );
  const photo = await avatar();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "56px 72px",
          background: `radial-gradient(circle at 85% 15%, ${ACCENT}55 0%, transparent 45%), linear-gradient(135deg, ${BACKGROUND} 0%, #06121e 100%)`,
          color: FOREGROUND,
          fontFamily: fonts.length ? "Inter" : undefined,
        }}
      >
        <div style={{ display: "flex", width: 560, height: 518, borderRadius: 28, overflow: "hidden", background: "#ffffff", border: `4px solid ${ACCENT}55` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og, not shown in the browser */}
          <img src={picture} width={560} height={518} alt="" style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 518, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              border: `2px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {kind.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og, not shown in the browser
              <img src={photo} width={96} height={96} alt="" style={{ borderRadius: 999, border: `3px solid ${ACCENT}` }} />
            )}
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{profile.name}</div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{site}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}

/** Branded 1200×630 share card: content type, title, summary, cover image and who wrote it. */
export async function renderOgImage({
  kind,
  title,
  description,
  cover,
}: {
  kind: string;
  title: string;
  description?: string;
  /** Public path of the entry's cover/logo, shown on the right when it can be read. */
  cover?: string;
}) {
  const picture = await coverImage(cover);
  // The renderer has no complex-script shaping: Bengali vowel signs come out in the wrong
  // order. When there's a cover (these usually carry the title already), show it large instead.
  const bengali = /[ঀ-৿]/.test(`${title}${description ?? ""}`);
  if (bengali && picture) return renderCoverCard(kind, picture);

  const heading = clip(title, picture ? 90 : 110);
  const summary = description ? clip(description, picture ? 130 : 170) : "";
  const site = config.siteUrl.replace(/^https?:\/\//, "");
  // The kind label is drawn uppercase, so request those glyphs too.
  const text = `${kind}${kind.toUpperCase()}${heading}${summary}${profile.name}${profile.title}${site}…`;

  const fonts = (
    await Promise.all([
      googleFont("Inter", 700, text),
      googleFont("Inter", 400, text),
      ...(bengali ? [googleFont("Noto Sans Bengali", 700, text), googleFont("Noto Sans Bengali", 400, text)] : []),
    ])
  ).filter((font): font is Font => font !== null);
  const photo = await avatar();
  const family = fonts.length ? (bengali ? "Inter, Noto Sans Bengali" : "Inter") : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `radial-gradient(circle at 85% 15%, ${ACCENT}55 0%, transparent 45%), linear-gradient(135deg, ${BACKGROUND} 0%, #06121e 100%)`,
          color: FOREGROUND,
          fontFamily: family,
        }}
      >
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              border: `2px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {kind.toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: heading.length > 70 ? 54 : 64, fontWeight: 700, lineHeight: 1.15 }}>{heading}</div>
          {summary && <div style={{ display: "flex", fontSize: 28, color: MUTED, lineHeight: 1.4, fontWeight: 400 }}>{summary}</div>}
        </div>
        {picture && (
          <div
            style={{
              display: "flex",
              width: 340,
              height: 340,
              flexShrink: 0,
              borderRadius: 28,
              overflow: "hidden",
              background: "#ffffff",
              border: `4px solid ${ACCENT}55`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og, not shown in the browser */}
            <img src={picture} width={340} height={340} alt="" style={{ objectFit: "contain" }} />
          </div>
        )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og, not shown in the browser
            <img src={photo} width={88} height={88} alt="" style={{ borderRadius: 999, border: `3px solid ${ACCENT}` }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{profile.name}</div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{site}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
