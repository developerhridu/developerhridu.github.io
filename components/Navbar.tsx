"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  House,
  UserRound,
  FolderCode,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  FileText,
  FileUser,
  Handshake,
  CalendarDays,
  Newspaper,
  BookOpenCheck,
  Search,
  Quote,
  Wrench,
  LayoutDashboard,
} from "lucide-react";
import Image from "next/image";
import menu from "@/content/menu.json";
import profile from "@/content/profile.json";
import uiStrings from "@/content/ui-strings.json";
import { trackEvent } from "@/lib/analytics";
import { resolveCvHref } from "@/lib/cv";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SearchPalette from "@/components/ui/SearchPalette";
import { TOKEN_KEY, TOKEN_CHANGED_EVENT } from "@/components/admin/shared";

const navLinks = menu.navLinks.filter(
  (link) => link.published !== false && (link.id !== "cv" || !!profile.resumeUrl)
);

function resolveHref(link: (typeof navLinks)[number]): string {
  return resolveCvHref(link);
}

// The homepage renders all sections inline; a couple of nav ids don't match the
// section's actual DOM id (e.g. "Training & Certifications" renders as one combined
// "education-certifications" section), so map those explicitly.
const NAV_ID_TO_SECTION_ID: Record<string, string> = {
  "training-certifications": "education-certifications",
};

const iconRegistry: Record<string, typeof House> = {
  house: House,
  "user-round": UserRound,
  "folder-code": FolderCode,
  "briefcase-business": BriefcaseBusiness,
  "graduation-cap": GraduationCap,
  mail: Mail,
  "file-text": FileText,
  "file-user": FileUser,
  newspaper: Newspaper,
  "book-open-check": BookOpenCheck,
  quote: Quote,
  wrench: Wrench,
  "layout-dashboard": LayoutDashboard,
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const pathname = usePathname();
  const visibleNavLinks = navLinks.filter((link) => link.id !== "admin" || hasValidToken);

  useEffect(() => {
    let controller: AbortController | undefined;

    async function validateToken() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setHasValidToken(false);

      try {
        const token = localStorage.getItem(TOKEN_KEY)?.trim();
        if (!token) return;

        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
          signal: request.signal,
        });

        if (!request.signal.aborted) {
          setHasValidToken(response.ok && localStorage.getItem(TOKEN_KEY)?.trim() === token);
        }
      } catch {
        if (!request.signal.aborted) setHasValidToken(false);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === TOKEN_KEY || event.key === null) void validateToken();
    }

    void validateToken();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(TOKEN_CHANGED_EVENT, validateToken);
    window.addEventListener("focus", validateToken);
    return () => {
      controller?.abort();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TOKEN_CHANGED_EVENT, validateToken);
      window.removeEventListener("focus", validateToken);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = navLinks
      .filter((link) => !link.external)
      .map((link) => document.getElementById(NAV_ID_TO_SECTION_ID[link.id] ?? link.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSectionId(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  function isLinkActive(link: (typeof navLinks)[number]): boolean {
    if (link.href === "/") {
      return pathname === "/" && (activeSectionId === null || activeSectionId === "home");
    }
    if (pathname === link.href) return true;
    if (pathname !== "/" || !activeSectionId) return false;
    return (NAV_ID_TO_SECTION_ID[link.id] ?? link.id) === activeSectionId;
  }

  const Logo = (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
      <div className="relative w-12 h-12 overflow-hidden shrink-0 rounded-lg ring-1 ring-border">
        <Image src={profile.avatar} alt={profile.name} fill sizes="48px" className="object-cover" />
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
          {visibleNavLinks.map((link) => {
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
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.name}
                </span>
              </a>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                aria-label={link.name}
                aria-current={isLinkActive(link) ? "page" : undefined}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-lg transition-colors ${
                  isLinkActive(link)
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          aria-label={uiStrings.navbar.searchAriaLabel}
          className="mt-auto flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Search size={20} />
        </button>
        <ThemeToggle className="mb-1" />

        <a
          href={profile.social.upwork}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={uiStrings.navbar.hireMeLabel}
          onClick={() => trackEvent("hire_me_click", { location: "navbar_desktop" })}
          className="group relative flex items-center justify-center w-11 h-11 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground transition-colors"
        >
          <Handshake size={20} />
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {uiStrings.navbar.hireMeLabel}
          </span>
        </a>

        {profile.bookingUrl && (
          <a
            href={profile.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={uiStrings.navbar.bookCallLabel}
            onClick={() => trackEvent("booking_click", { location: "navbar_desktop" })}
            className="group relative flex items-center justify-center w-11 h-11 mt-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
          >
            <CalendarDays size={20} />
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg bg-surface border border-border px-2 py-1 text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {uiStrings.navbar.bookCallLabel}
            </span>
          </a>
        )}
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
                aria-label={uiStrings.navbar.searchAriaLabel}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Search size={18} />
              </button>
              <ThemeToggle className="w-9 h-9" />
              {profile.bookingUrl && (
                <a
                  href={profile.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={uiStrings.navbar.bookCallLabel}
                  onClick={() => trackEvent("booking_click", { location: "navbar_mobile" })}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                >
                  <CalendarDays size={18} />
                </a>
              )}
              <a
                href={profile.social.upwork}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("hire_me_click", { location: "navbar_mobile" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm transition-colors"
              >
                <Handshake size={16} />
                {uiStrings.navbar.hireMeLabel}
              </a>
              <button
                className="text-foreground"
                aria-label={isMobileMenuOpen ? uiStrings.navbar.closeMenuAriaLabel : uiStrings.navbar.openMenuAriaLabel}
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
              {visibleNavLinks.map((link) =>
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
                      isLinkActive(link)
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
