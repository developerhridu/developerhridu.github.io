import { Metadata } from "next";
import GlassCard from "@/components/ui/GlassCard";
import TrackedLink from "@/components/ui/TrackedLink";
import ThumbnailGallery from "@/components/ui/ThumbnailGallery";
import { coverImages } from "@/lib/coverImages";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedClients } from "@/lib/clients";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

export const metadata: Metadata = getSeo("clients");

export default function ClientsPage() {
  const clients = getPublishedClients();
  const sectionCopy = getSectionCopy("clients");

  return (
    <div className="pt-16 md:pt-0">
      <section id="clients" className="py-20">
        <div className={PAGE_CONTAINER}>
          <SectionHeading as="h1" eyebrow={sectionCopy.eyebrow} title={sectionCopy.title} subtitle={sectionCopy.subtitle} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((client) => (
              <GlassCard key={client.id} className="relative h-full min-w-0 flex flex-col items-center group cursor-pointer">
                  <TrackedLink
                    href={`/clients/${client.slug}`}
                    area="client"
                    label={client.slug}
                    className="absolute inset-0 z-10 rounded-xl"
                    aria-label={`View ${client.name}`}
                  />
                  <ThumbnailGallery
                    images={coverImages(client)}
                    alt={client.name}
                    wrapperClassName="w-full h-28 overflow-hidden rounded-lg mb-4 bg-white/90"
                    imgClassName="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    initials={client.name.split(" ").slice(0, 2).map((word) => word[0]).join("")}
                  />
                  <h2 className="text-base font-semibold text-foreground text-center group-hover:text-accent transition-colors">
                    {client.name}
                  </h2>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
