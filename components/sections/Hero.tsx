"use client";

import { motion } from "framer-motion";
import { ArrowDown, Code2, ExternalLink, Github, Handshake, Linkedin } from "lucide-react";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import profile from "@/content/profile.json";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 md:pt-0">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-violet-400 font-medium mb-4">Hi, I&apos;m</p>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {profile.name}
            </h1>
            <h2 className="text-2xl md:text-3xl text-slate-300 mb-4">
              {profile.title}
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
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
            <Button href={profile.social.upwork} target="_blank" rel="noopener noreferrer" variant="primary">
              <Handshake size={18} />
              Hire Me
            </Button>
            <Button href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" variant="secondary">
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
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              <Github size={24} />
            </a>
            <a
              href={profile.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              <Linkedin size={24} />
            </a>
            <a
              href={profile.social.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LeetCode profile"
              className="text-slate-400 hover:text-white transition-colors p-2"
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
              <div className="text-3xl font-bold text-white mb-1">
                {profile.yearsOfExperience}+
              </div>
              <div className="text-sm text-slate-400">Years Experience</div>
            </GlassCard>
            <GlassCard className="text-center" hover={false}>
              <div className="text-3xl font-bold text-white mb-1">
                {profile.projectsCompleted}+
              </div>
              <div className="text-sm text-slate-400">Projects Completed</div>
            </GlassCard>
            <GlassCard className="text-center col-span-2 md:col-span-1" hover={false}>
              <div className="text-3xl font-bold text-white mb-1">3</div>
              <div className="text-sm text-slate-400">Companies</div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
