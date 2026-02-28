"use client";

import Link from "next/link";
import { Code2, Github, Linkedin, Mail } from "lucide-react";
import profile from "@/content/profile.json";

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
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/projects" className="hover:text-white transition-colors">
                Projects
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
