import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { trackClick } from "@/lib/analytics";
import type { Client } from "@/types";

/** Width the orbit and the mobile band both position this card with. */
export const CLIENT_PREVIEW_WIDTH = 240;

/**
 * The client preview shown on hover (orbit) and on tap (mobile band): logo, name, a short
 * blurb and a link through to the client page. Shared so both behave identically.
 */
export default function ClientPreviewCard({ client }: { client: Client & { image: string } }) {
  return (
    <Link
      href={`/clients/${client.slug}`}
      onClick={() => trackClick("client", client.slug)}
      className="group block rounded-2xl border border-border bg-surface/95 backdrop-blur-md p-3 shadow-xl"
    >
      <div className="relative h-24 w-full rounded-lg bg-white/90 mb-3">
        <Image src={client.image} alt="" fill sizes={`${CLIENT_PREVIEW_WIDTH}px`} className="object-contain p-4" />
      </div>
      <p className="text-base font-semibold text-foreground text-center group-hover:text-accent transition-colors">
        {client.name}
      </p>
      {client.description && (
        <p className="mt-1 text-xs text-muted text-center line-clamp-2">{client.description}</p>
      )}
      <p className="mt-2 flex items-center justify-center gap-1 text-xs text-accent">
        View client <ArrowRight size={12} aria-hidden="true" />
      </p>
    </Link>
  );
}
