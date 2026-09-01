import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";
import ClientBadge from "@/components/ui/ClientBadge";
import { resolveClients } from "@/lib/clients";

export interface ContentCardItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  image?: string;
  client?: string;
  readingMinutes: number;
}

interface ContentCardProps {
  item: ContentCardItem;
  viewPath: string;
  showReadMore?: boolean;
}

export default function ContentCard({ item, viewPath, showReadMore = false }: ContentCardProps) {
  const clients = resolveClients(item.client);

  return (
    <Link href={`${viewPath}/${item.slug}`}>
      <GlassCard className="h-full flex flex-col group cursor-pointer">
        <ContentImage
          src={item.image}
          alt={item.title}
          wrapperClassName="h-48 rounded-lg mb-4"
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          initials={item.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
        />

        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-mono px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
            {item.title}
          </h3>
          <p className="text-muted text-sm mb-4 line-clamp-2">{item.description}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {clients.map((c) => (
              <ClientBadge key={c.id} client={c} iconSize={14} />
            ))}
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {item.readingMinutes} min read
            </span>
          </div>
          {showReadMore && (
            <span className="flex items-center gap-1 text-sm text-accent group-hover:gap-2 transition-all shrink-0">
              Read more <ArrowRight size={14} />
            </span>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
