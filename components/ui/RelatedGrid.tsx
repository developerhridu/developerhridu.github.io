import Link from "next/link";
import { ArrowRight, Building2, Calendar, FileText, FolderKanban, PenLine } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import { coverImages } from "@/lib/coverImages";
import type { RelatedItem } from "@/lib/related";

const KINDS = {
  project: { label: "Project", basePath: "/projects", Icon: FolderKanban },
  "case-study": { label: "Case Study", basePath: "/case-studies", Icon: FileText },
  blog: { label: "Blog", basePath: "/blog", Icon: PenLine },
  client: { label: "Client", basePath: "/clients", Icon: Building2 },
};

/** "Related Content" card grid shared by blog, case study, project, and client pages. */
export default function RelatedGrid({ items }: { items: RelatedItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border" aria-labelledby="related-content-heading">
      <h2 id="related-content-heading" className="text-2xl font-bold text-foreground mb-6">
        Related Content <span className="text-muted font-normal text-lg">({items.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const kind = KINDS[item.kind];
          return (
              <GlassCard key={`${item.kind}:${item.slug}`} className="relative h-full min-w-0 flex flex-col group cursor-pointer">
                <Link href={`${kind.basePath}/${item.slug}`} className="absolute inset-0 z-10 rounded-xl" aria-label={`View ${item.title}`} />
                <ThumbnailGallery
                  images={coverImages(item)}
                  alt={item.title}
                  wrapperClassName="h-40 overflow-hidden rounded-lg mb-4"
                  imgClassName={`w-full h-full ${item.kind === "client" ? "object-contain bg-white/90 p-4" : "object-cover"} group-hover:scale-105 transition-transform duration-300`}
                  initials={item.title.split(" ").slice(0, 2).map((word) => word[0]).join("")}
                />
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium">
                    <kind.Icon size={12} />
                    {kind.label}
                  </span>
                  {item.date && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  {item.description && <p className="text-muted text-sm mb-4 line-clamp-2">{item.description}</p>}
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
          );
        })}
      </div>
    </section>
  );
}
