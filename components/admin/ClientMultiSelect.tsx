"use client";

import Image from "next/image";
import { getClients, parseClientNames } from "@/lib/clients";

interface ClientMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClientMultiSelect({ value, onChange }: ClientMultiSelectProps) {
  const clients = getClients();
  const selected = parseClientNames(value);

  function toggle(name: string) {
    const isSelected = selected.some((n) => n.toLowerCase() === name.toLowerCase());
    const next = isSelected
      ? selected.filter((n) => n.toLowerCase() !== name.toLowerCase())
      : [...selected, name];
    onChange(next.join(", "));
  }

  if (clients.length === 0) {
    return <p className="text-muted text-xs">No clients yet — add some in the Clients tab.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {clients.map((client) => {
        const isSelected = selected.some((n) => n.toLowerCase() === client.name.toLowerCase());
        return (
          <label
            key={client.id}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
              isSelected
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggle(client.name)}
              className="w-3.5 h-3.5 accent-accent"
            />
            {client.logo && (
              <span className="relative w-4 h-4 shrink-0 rounded bg-white/90 overflow-hidden">
                <Image src={client.logo} alt={client.name} fill sizes="16px" className="object-contain p-0.5" />
              </span>
            )}
            {client.name}
          </label>
        );
      })}
    </div>
  );
}
