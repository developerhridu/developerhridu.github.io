"use client";

import Link from "next/link";
import { Code2, Github, Handshake, Linkedin, Mail } from "lucide-react";
import profile from "@/content/profile.json";
import navigation from "@/content/navigation.json";
import { trackEvent } from "@/lib/analytics";

const footerLinks = navigation.navLinks.filter((link) => link.href !== "/");

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 py-8 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-slate-400 text-sm">
              {currentYear} {profile.name}. Built with Next.js & Tailwind CSS.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {footerLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => link.name === "CV" && trackEvent("resume_view", { location: "footer" })}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={profile.social.upwork}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("hire_me_click", { location: "footer" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
            >
              <Handshake size={16} />
              Hire Me
            </a>
            <a
              href={profile.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href={profile.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Linkedin size={20} />
            </a>
            <a
              href={profile.social.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Code2 size={20} />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
