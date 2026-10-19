import { getEmployer, getEmployers } from "@/lib/employers";
import { renderOgImage } from "@/lib/ogImage";
import { slugFromOgParam } from "@/lib/ogImageUrl";
import { primaryCoverImage } from "@/lib/coverImages";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getEmployers().map((employer) => ({ slug: `${employer.slug}.png` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const employer = getEmployer(slugFromOgParam((await params).slug));
  return renderOgImage({
    kind: "Employer",
    title: employer?.name ?? "Employer",
    description: employer?.description,
    cover: employer ? primaryCoverImage(employer) : undefined,
  });
}
