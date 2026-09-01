import Image from "next/image";
import clientsData from "@/content/clients.json";
import type { Client } from "@/types";

const CLIENTS: Client[] = clientsData.clients;

const CLIENTS_WITH_LOGOS = CLIENTS.filter(
  (client): client is Client & { logo: string } => !!client.logo
);

const CHIP_CLASS =
  "flex items-center justify-center w-36 h-24 shrink-0 rounded-xl bg-white/90 px-5 py-3 transition-transform hover:scale-105";

function LogoTrack({ ariaHidden }: { ariaHidden: boolean }) {
  return (
    <div className="flex items-center gap-12 pr-12 shrink-0" aria-hidden={ariaHidden || undefined}>
      {CLIENTS_WITH_LOGOS.map((client) => {
        const logo = (
          <div className="relative w-full h-full">
            <Image src={client.logo} alt={client.name} fill sizes="144px" className="object-contain" />
          </div>
        );

        return client.url ? (
          <a
            key={client.id}
            href={client.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={ariaHidden ? -1 : undefined}
            className={CHIP_CLASS}
          >
            {logo}
          </a>
        ) : (
          <div key={client.id} className={CHIP_CLASS}>
            {logo}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientMarquee() {
  if (CLIENTS_WITH_LOGOS.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-center text-xs uppercase tracking-widest text-muted mb-4">
        Companies I&apos;ve worked with
      </p>
      <div className="relative overflow-hidden marquee-fade" role="list" aria-label="Companies I've worked with">
        <div className="flex w-max animate-marquee">
          <LogoTrack ariaHidden={false} />
          <LogoTrack ariaHidden={true} />
        </div>
      </div>
    </div>
  );
}
