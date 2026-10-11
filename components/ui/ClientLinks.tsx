import Link from "next/link";
import { Building2 } from "lucide-react";
import { findClientByName, parseClientNames } from "@/lib/clients";
import { isPublished } from "@/lib/published";

interface ClientLinksProps {
  client?: string;
  className?: string;
}

const LINK_CLASS = "text-accent hover:text-accent-hover transition-colors";

/** Client names linking to their detail page when published, otherwise to their website. */
export default function ClientLinks({ client, className = "" }: ClientLinksProps) {
  const names = parseClientNames(client);
  if (names.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted ${className}`}>
      <Building2 size={16} className="shrink-0" />
      {names.map((name, index) => {
        const match = findClientByName(name);
        return (
          <span key={name}>
            {match && isPublished(match) ? (
              <Link href={`/clients/${match.slug}`} className={LINK_CLASS}>{name}</Link>
            ) : match?.url ? (
              <a href={match.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>{name}</a>
            ) : (
              name
            )}
            {index < names.length - 1 && ","}
          </span>
        );
      })}
    </div>
  );
}
