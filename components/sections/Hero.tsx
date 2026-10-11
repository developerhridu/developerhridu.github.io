"use client";

import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";
import ClientMarquee from "@/components/ui/ClientMarquee";
import ClientOrbit from "@/components/ui/ClientOrbit";
import profile from "@/content/profile.json";
import uiStrings from "@/content/ui-strings.json";
import { getPublishedClients } from "@/lib/clients";
import { trackEvent } from "@/lib/analytics";

const publishedClientCount = getPublishedClients().length;

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16 md:pt-0">
      {/* Dot-grid background */}
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Client logos orbiting the hero content (large screens) */}
      <motion.div
        className="hidden lg:block absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <ClientOrbit />
      </motion.div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 w-full" data-orbit-avoid>
        <div className="text-center">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {profile.openToWork && (
              <div data-orbit-avoid-item className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-xs font-medium text-accent">
                  {profile.openToWorkLabel || "Open to work"}
                </span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
              {profile.name}
            </h1>
            <h2 className="mt-3 text-xl md:text-3xl font-semibold tracking-tight leading-tight text-accent mb-10">
              {profile.title}
            </h2>
          </motion.div>

          {/* Book a call (only when a booking link is set) */}
          {profile.bookingUrl && (
            <motion.div
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                href={profile.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                onClick={() => trackEvent("booking_click", { location: "hero" })}
              >
                <CalendarDays size={18} />
                {uiStrings.hero.ctaBookCall}
              </Button>
            </motion.div>
          )}

          {/* Stats — one compact bar */}
          <motion.dl
            className="mx-auto grid grid-cols-2 sm:grid-cols-4 max-w-2xl rounded-2xl border border-border bg-surface/70 backdrop-blur-md divide-y sm:divide-y-0 sm:divide-x divide-border overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { value: profile.yearsOfExperience, label: uiStrings.hero.statYearsExperience },
              { value: profile.projectsCompleted, label: uiStrings.hero.statProjectsCompleted },
              { value: profile.servicesWorkWith, label: uiStrings.hero.statServices },
              { value: publishedClientCount, label: uiStrings.hero.statClients },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse items-center px-4 py-4">
                <dt className="text-xs text-muted mt-1">{stat.label}</dt>
                <dd className="text-2xl font-bold text-foreground tabular-nums">{stat.value}+</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      {/* Client Logos — full-width trusted-by band (small screens; large screens use the orbit) */}
      <motion.div
        className="lg:hidden relative z-10 w-full mt-14 pt-8 border-t border-border/60"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <ClientMarquee />
      </motion.div>
    </section>
  );
}
