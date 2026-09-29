"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { getClients } from "@/lib/clients";
import config from "@/content/config.json";

/** Per-client links to the public testimonial form, prefilled with the client's
 *  company. The form itself posts to the Worker, so the recipient never needs
 *  any credential — they just fill it in and it lands unpublished for review. */
export default function TestimonialRequestLinks() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const clients = getClients();

  function linkFor(clientId: string) {
    return `${config.siteUrl}/testimonials/submit?from=${encodeURIComponent(clientId)}`;
  }

  async function copy(clientId: string) {
    try {
      await navigator.clipboard.writeText(linkFor(clientId));
      setCopied(clientId);
      setTimeout(() => setCopied((c) => (c === clientId ? null : c)), 2000);
    } catch {
      setCopied(null);
    }
  }

  if (clients.length === 0) return null;

  return (
    <div className="mb-4 border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted hover:text-foreground transition-colors"
      >
        <Link2 size={16} className="shrink-0" />
        Request a testimonial
        <span className="ml-auto text-xs">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-muted">
            Send a client their link. It opens the public form with their company filled in, and
            their reply arrives unpublished for you to approve here.
          </p>
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border"
            >
              <span className="text-sm text-foreground shrink-0">{client.name}</span>
              <code className="flex-1 min-w-0 truncate font-mono text-xs text-muted">
                {linkFor(client.id)}
              </code>
              <button
                type="button"
                onClick={() => void copy(client.id)}
                aria-label={`Copy request link for ${client.name}`}
                className="shrink-0 flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
              >
                {copied === client.id ? <Check size={14} /> : <Copy size={14} />}
                {copied === client.id ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
