import { ImageResponse } from "next/og";

export function renderOgImage(title: string, category: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0A1B2B 0%, #102a43 60%, #0d3b52 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#38bdf8",
          }}
        >
          {category}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#F8FAFC",
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            color: "#94A3B8",
          }}
        >
          Mizanur Rahman — Full-Stack Software Engineer
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
