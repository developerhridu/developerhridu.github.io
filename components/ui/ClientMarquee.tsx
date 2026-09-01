import Image from "next/image";
import clientsData from "@/content/clients.json";

const CLIENTS_WITH_LOGOS = clientsData.clients.filter(
  (client): client is typeof client & { logo: string } => !!client.logo
);

function LogoTrack({ ariaHidden }: { ariaHidden: boolean }) {
  return (
    <div className="flex items-center gap-12 pr-12 shrink-0" aria-hidden={ariaHidden || undefined}>
      {CLIENTS_WITH_LOGOS.map((client) => (
        <div
          key={client.id}
          className="flex items-center justify-center w-36 h-24 shrink-0 rounded-xl bg-white/90 px-5 py-3 transition-transform hover:scale-105"
        >
          <div className="relative w-full h-full">
            <Image src={client.logo} alt={client.name} fill sizes="144px" className="object-contain" />
          </div>
        </div>
      ))}
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
