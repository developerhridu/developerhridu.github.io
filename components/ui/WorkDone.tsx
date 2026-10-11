import Link from "next/link";
import { ArrowRight, FileText, FolderKanban } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";

interface WorkItem {
  slug: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  published?: boolean;
}

interface WorkDoneProps {
  projects: WorkItem[];
  caseStudies: WorkItem[];
}

/** Picks the published items matching `slugs`, in the order the slugs were selected. */
export function pickBySlugs<T extends WorkItem>(items: T[], slugs: string[] | undefined): T[] {
  return (slugs ?? [])
    .map((slug) => items.find((item) => item.slug === slug))
    .filter((item): item is T => !!item && item.published !== false);
}

const KINDS = {
  project: { label: "Project", basePath: "/projects", Icon: FolderKanban },
  "case-study": { label: "Case Study", basePath: "/case-studies", Icon: FileText },
};

/** Visual grid of the projects and case studies done for a client. */
export default function WorkDone({ projects, caseStudies }: WorkDoneProps) {
  const items = [
    ...projects.map((item) => ({ item, kind: KINDS.project })),
    ...caseStudies.map((item) => ({ item, kind: KINDS["case-study"] })),
  ];
  if (items.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border" aria-labelledby="work-done-heading">
      <h2 id="work-done-heading" className="text-2xl font-bold text-foreground mb-6">
        Work Done <span className="text-muted font-normal text-lg">({items.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(({ item, kind }) => (
          <Link key={`${kind.basePath}/${item.slug}`} href={`${kind.basePath}/${item.slug}`} className="block h-full min-w-0">
            <GlassCard className="h-full flex flex-col group cursor-pointer">
              <ContentImage
                src={item.image}
                alt={item.title}
                wrapperClassName="h-40 rounded-lg mb-4"
                imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                initials={item.title.split(" ").slice(0, 2).map((word) => word[0]).join("")}
              />
              <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-3 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium">
                <kind.Icon size={12} />
                {kind.label}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted text-sm mb-4 line-clamp-2">{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="flex items-center gap-1 pt-4 border-t border-border text-sm text-accent group-hover:gap-2 transition-all">
                View {kind.label.toLowerCase()} <ArrowRight size={14} />
              </span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
