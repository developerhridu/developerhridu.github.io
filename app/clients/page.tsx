import { Metadata } from "next";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import ContentImage from "@/components/ui/ContentImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedClients } from "@/lib/clients";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";

export const metadata: Metadata = getSeo("clients");

export default function ClientsPage() {
  const clients = getPublishedClients();
  const sectionCopy = getSectionCopy("clients");

  return (
    <div className="pt-16 md:pt-0">
      <section id="clients" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow={sectionCopy.eyebrow} title={sectionCopy.title} subtitle={sectionCopy.subtitle} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.slug}`} className="block h-full min-w-0">
                <GlassCard className="h-full flex flex-col items-center group cursor-pointer">
                  <ContentImage
                    src={client.image || undefined}
                    alt={client.name}
                    wrapperClassName="w-full h-28 rounded-lg mb-4 bg-white/90"
                    imgClassName="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    initials={client.name.split(" ").slice(0, 2).map((word) => word[0]).join("")}
                  />
                  <h2 className="text-base font-semibold text-foreground text-center group-hover:text-accent transition-colors">
                    {client.name}
                  </h2>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
