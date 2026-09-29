import { Building2 } from "lucide-react";
import { getClients, parseClientNames } from "@/lib/clients";

interface ClientLinksProps {
  client?: string;
  className?: string;
}

export default function ClientLinks({ client, className = "" }: ClientLinksProps) {
  const names = parseClientNames(client);
  if (names.length === 0) return null;

  const clients = getClients();
  const resolved = names.map((name) => ({
    name,
    url: clients.find((c) => c.name.toLowerCase() === name.toLowerCase())?.url ?? null,
  }));

  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted ${className}`}>
      <Building2 size={16} className="shrink-0" />
      {resolved.map((entry, index) => (
        <span key={entry.name}>
          {entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {entry.name}
            </a>
          ) : (
            entry.name
          )}
          {index < resolved.length - 1 && ","}
        </span>
      ))}
    </div>
  );
}
