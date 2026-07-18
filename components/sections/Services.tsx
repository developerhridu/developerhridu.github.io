"use client";

import { motion } from "framer-motion";
import { Server, Layers, Plug, Gauge, ShieldCheck, RefreshCw, CheckCircle2, Wrench } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeading from "@/components/ui/SectionHeading";
import servicesData from "@/content/services.json";
import type { Service } from "@/types";

interface ServicesProps {
  showHeading?: boolean;
  noSection?: boolean;
}

const iconRegistry: Record<string, typeof Server> = {
  server: Server,
  layers: Layers,
  plug: Plug,
  gauge: Gauge,
  "shield-check": ShieldCheck,
  "refresh-cw": RefreshCw,
};

export default function Services({ showHeading = true, noSection = false }: ServicesProps) {
  const services = (servicesData.services || []) as Service[];

  if (services.length === 0) return null;

  const content = (
    <>
      {showHeading && (
        <SectionHeading
          eyebrow="Services"
          title="Services I Offer"
          subtitle="How I can help with your next project"
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, idx) => {
          const Icon = (service.icon && iconRegistry[service.icon]) || Wrench;
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
            >
              <GlassCard className="h-full flex flex-col">
                <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-muted flex-1 mb-4">{service.description}</p>
                {service.highlights && service.highlights.length > 0 && (
                  <ul className="space-y-1.5">
                    {service.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </>
  );

  if (noSection) return content;

  return (
    <section id="services" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">{content}</div>
    </section>
  );
}
