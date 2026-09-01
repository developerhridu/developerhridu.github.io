import Image from "next/image";
import { Building2 } from "lucide-react";
import type { Client } from "@/types";

interface ClientBadgeProps {
  client: Client;
  iconSize?: number;
}

export default function ClientBadge({ client, iconSize = 14 }: ClientBadgeProps) {
  const boxSize = iconSize + 4;

  return (
    <span className="inline-flex items-center gap-1.5">
      {client.logo ? (
        <span
          className="relative shrink-0 rounded bg-white/90 overflow-hidden"
          style={{ width: boxSize, height: boxSize }}
        >
          <Image
            src={client.logo}
            alt={client.name}
            fill
            sizes={`${boxSize}px`}
            className="object-contain p-0.5"
          />
        </span>
      ) : (
        <Building2 size={iconSize} />
      )}
      {client.name}
    </span>
  );
}
