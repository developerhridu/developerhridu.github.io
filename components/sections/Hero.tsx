"use client";

import { motion } from "framer-motion";
import { ArrowDown, ExternalLink, Handshake } from "lucide-react";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import ClientMarquee from "@/components/ui/ClientMarquee";
import profile from "@/content/profile.json";
import clientsData from "@/content/clients.json";
import { trackEvent } from "@/lib/analytics";

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16 md:pt-0">
      {/* Dot-grid background */}
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="text-center">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {profile.openToWork && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-xs font-medium text-accent">
                  {profile.openToWorkLabel || "Open to work"}
                </span>
              </div>
            )}
            <p className="font-mono text-s tracking-widest text-accent mb-4">
              Hi, I'm
            </p>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              {profile.name}
            </h1>
            <h2 className="text-2xl md:text-3xl text-muted mb-4">
              {profile.title}
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-8">
              {profile.tagline}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button href="/projects" variant="primary">
              View Projects
              <ArrowDown size={18} />
            </Button>
            <Button
              href={profile.social.upwork}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              onClick={() => trackEvent("hire_me_click", { location: "hero" })}
            >
              <Handshake size={18} />
              Hire Me
            </Button>
            {profile.resumeUrl && (
              <Button
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                onClick={() => trackEvent("resume_view", { location: "hero" })}
              >
                <ExternalLink size={18} />
                View Resume
              </Button>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassCard className="!p-3 text-center" hover={false}>
              <div className="text-xl font-bold text-foreground mb-0.5">
                {profile.yearsOfExperience}+
              </div>
              <div className="text-xs text-muted">Years Experience</div>
            </GlassCard>
            <GlassCard className="!p-3 text-center" hover={false}>
              <div className="text-xl font-bold text-foreground mb-0.5">
                {profile.projectsCompleted}+
              </div>
              <div className="text-xs text-muted">Projects Completed</div>
            </GlassCard>
            <GlassCard className="!p-3 text-center col-span-2 md:col-span-1" hover={false}>
              <div className="text-xl font-bold text-foreground mb-0.5">
                {clientsData.clients.length}+
              </div>
              <div className="text-xs text-muted">Clients</div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Client Logos — full-width trusted-by band */}
      <motion.div
        className="relative z-10 w-full mt-14 pt-8 border-t border-border/60"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <ClientMarquee />
      </motion.div>
    </section>
  );
}
