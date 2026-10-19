import { getClient, getClients } from "@/lib/clients";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";
import { primaryCoverImage } from "@/lib/coverImages";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getClients().map((client) => ({ slug: `${client.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const client = getClient(slugFromOgParam((await params).slug));
  return renderOgImage({
    kind: "Client",
    title: client?.name ?? "Client",
    description: client?.description,
    cover: client ? primaryCoverImage(client) : undefined,
  });
}
