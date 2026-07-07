"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  User,
  FolderKanban,
  Briefcase,
  Award,
  Mail,
  FileText,
  Handshake,
} from "lucide-react";
import navigation from "@/content/navigation.json";
import profile from "@/content/profile.json";

const navLinks = navigation.navLinks;

const iconMap: Record<string, typeof Home> = {
  "/": Home,
  "/about": User,
  "/projects": FolderKanban,
  "/experience": Briefcase,
  "/certifications": Award,
  "/contact": Mail,
  "/resume-2026-v2.pdf": FileText,
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const Logo = (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
      <div className="w-12 h-12 overflow-hidden shrink-0 rounded-md">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Portfolio */}
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav
        aria-label="Main navigation"
        className="hidden md:flex fixed top-0 left-0 bottom-0 z-50 w-20 flex-col items-center bg-slate-900/80 backdrop-blur-lg border-r border-white/10 py-6"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">{Logo}</div>
        <div className="flex flex-col items-center gap-1">
          {navLinks.map((link) => {
            const Icon = iconMap[link.href] ?? FileText;
            return link.external ? (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="group relative flex items-center justify-center w-11 h-11 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-800 border border-white/10 px-2 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.name}
                </span>
              </a>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                aria-label={link.name}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-violet-400 bg-violet-500/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-800 border border-white/10 px-2 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        <a
          href={profile.social.upwork}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hire Me"
          className="group relative mt-auto flex items-center justify-center w-11 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Handshake size={20} />
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-slate-800 border border-white/10 px-2 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Hire Me
          </span>
        </a>
      </motion.nav>

      {/* Mobile Top Bar */}
      <motion.nav
        aria-label="Main navigation"
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {Logo}
            <div className="flex items-center gap-3">
              <a
                href={profile.social.upwork}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
              >
                <Handshake size={16} />
                Hire Me
              </a>
              <button
                className="text-white"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <motion.div
              className="py-4 border-t border-white/10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 text-slate-300 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block py-2 transition-colors ${
                      pathname === link.href
                        ? "text-violet-400"
                        : "text-slate-300 hover:text-white"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              )}
            </motion.div>
          )}
        </div>
      </motion.nav>
    </>
  );
}
