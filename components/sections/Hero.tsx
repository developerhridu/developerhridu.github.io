"use client";

import { motion } from "framer-motion";
import { ArrowDown, Code2, Crosshair, ExternalLink, Github, Handshake, Linkedin } from "lucide-react";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import profile from "@/content/profile.json";
import { trackEvent } from "@/lib/analytics";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 md:pt-0">
      {/* Dot-grid background */}
      <div className="bg-grid absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Orbit badge */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] xl:w-[640px] xl:h-[640px] pointer-events-none">
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ backgroundImage: "radial-gradient(circle at center, rgba(34,211,238,0.10), transparent 65%)" }}
        />
        <div className="animate-orbit-spin absolute inset-0">
          <div className="absolute inset-6 rounded-full border border-border/60" />
          <div className="absolute inset-16 rounded-full border border-border" />
          <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
            <defs>
              <path
                id="hero-orbit-path"
                d="M 160,160 m -112,0 a 112,112 0 1,1 224,0 a 112,112 0 1,1 -224,0"
              />
            </defs>
            <text className="fill-accent font-mono uppercase" fontSize="10" letterSpacing="3">
              <textPath href="#hero-orbit-path" startOffset="0%">
                .NET · Angular · React · .NET · Angular · React ·
              </textPath>
            </text>
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border border-accent/40 bg-surface/60 flex items-center justify-center">
            <Crosshair className="text-accent" size={20} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-s tracking-widest text-accent mb-4">
              — Hi, I'm
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
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a
              href={profile.social.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="text-muted hover:text-foreground transition-colors p-2"
            >
              <Github size={24} />
            </a>
            <a
              href={profile.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="text-muted hover:text-foreground transition-colors p-2"
            >
              <Linkedin size={24} />
            </a>
            <a
              href={profile.social.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LeetCode profile"
              className="text-muted hover:text-foreground transition-colors p-2"
            >
              <Code2 size={24} />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassCard className="text-center" hover={false}>
              <div className="text-3xl font-bold text-foreground mb-1">
                {profile.yearsOfExperience}+
              </div>
              <div className="text-sm text-muted">Years Experience</div>
            </GlassCard>
            <GlassCard className="text-center" hover={false}>
              <div className="text-3xl font-bold text-foreground mb-1">
                {profile.projectsCompleted}+
              </div>
              <div className="text-sm text-muted">Projects Completed</div>
            </GlassCard>
            <GlassCard className="text-center col-span-2 md:col-span-1" hover={false}>
              <div className="text-3xl font-bold text-foreground mb-1">3</div>
              <div className="text-sm text-muted">Companies</div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
