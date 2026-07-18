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
  FileUser,
  Handshake,
  Newspaper,
  Layers,
  Search,
  Quote,
  Wrench,
} from "lucide-react";
import menu from "@/content/menu.json";
import profile from "@/content/profile.json";
import { trackEvent } from "@/lib/analytics";
import { resolveCvHref } from "@/lib/cv";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SearchPalette from "@/components/ui/SearchPalette";

const navLinks = menu.navLinks.filter(
  (link) => link.published !== false && (link.id !== "cv" || !!profile.resumeUrl)
);

function resolveHref(link: (typeof navLinks)[number]): string {
  return resolveCvHref(link, profile.resumeUrl);
}

const iconRegistry: Record<string, typeof Home> = {
  home: Home,
  user: User,
  "folder-kanban": FolderKanban,
  briefcase: Briefcase,
  award: Award,
  mail: Mail,
  "file-text": FileText,
  "file-user": FileUser,
  newspaper: Newspaper,
  layers: Layers,
  quote: Quote,
  wrench: Wrench,
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const Logo = (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
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
        className="print:hidden hidden md:flex fixed top-0 left-0 bottom-0 z-50 w-20 flex-col items-center bg-surface/90 backdrop-blur-lg border-r border-border py-6"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">{Logo}</div>
        <div className="flex flex-col items-center gap-1">
          {navLinks.map((link) => {
            const Icon = iconRegistry[link.icon] ?? FileText;
            return link.external ? (
              <a
                key={link.name}
                href={resolveHref(link)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                onClick={() => link.name === "CV" && trackEvent("resume_view", { location: "navbar_desktop" })}
                className="group relative flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="mt-auto flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Search size={20} />
        </button>
        <ThemeToggle className="mb-1" />

        <a
          href={profile.social.upwork}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Hire Me"
          onClick={() => trackEvent("hire_me_click", { location: "navbar_desktop" })}
          className="group relative flex items-center justify-center w-11 h-11 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground transition-colors"
        >
          <Handshake size={20} />
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Hire Me
          </span>
        </a>
      </motion.nav>

      {/* Mobile Top Bar */}
      <motion.nav
        aria-label="Main navigation"
        className="print:hidden md:hidden fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {Logo}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Search size={18} />
              </button>
              <ThemeToggle className="w-9 h-9" />
              <a
                href={profile.social.upwork}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("hire_me_click", { location: "navbar_mobile" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm transition-colors"
              >
                <Handshake size={16} />
                Hire Me
              </a>
              <button
                className="text-foreground"
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
              className="py-4 border-t border-border"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.name}
                    href={resolveHref(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 text-muted hover:text-foreground transition-colors"
                    onClick={() => {
                      if (link.name === "CV") trackEvent("resume_view", { location: "navbar_mobile" });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block py-2 transition-colors ${
                      pathname === link.href
                        ? "text-accent"
                        : "text-muted hover:text-foreground"
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

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
