import Link from "next/link";
import { Calendar } from "lucide-react";

interface RelatedItem {
  slug: string;
  title: string;
  date: string;
  description: string;
}

interface RelatedContentProps {
  items: RelatedItem[];
  basePath: string;
  heading: string;
}

export default function RelatedContent({ items, basePath, heading }: RelatedContentProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">{heading}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className="group block p-4 border border-border rounded-lg hover:border-accent/40 transition-colors"
          >
            <p className="flex items-center gap-1 text-xs text-muted mb-1">
              <Calendar size={12} />
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {item.title}
            </h3>
            <p className="text-muted text-sm line-clamp-2">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
