"use client";

import Link from "next/link";
import { CalendarDays, Code2, Github, Handshake, Linkedin, Mail } from "lucide-react";
import profile from "@/content/profile.json";
import menu from "@/content/menu.json";
import uiStrings from "@/content/ui-strings.json";
import { trackEvent } from "@/lib/analytics";
import { resolveCvHref } from "@/lib/cv";
import { PAGE_CONTAINER } from "@/components/ui/PageContainer";

const t = uiStrings.footer;

const footerLinks = menu.navLinks.filter(
  (link) =>
    link.href !== "/" && link.id !== "admin" && link.published !== false && (link.id !== "cv" || !!profile.resumeUrl)
);

const socials = [
  { href: profile.social.github, label: "GitHub", Icon: Github },
  { href: profile.social.linkedin, label: "LinkedIn", Icon: Linkedin },
  { href: profile.social.leetcode, label: "LeetCode", Icon: Code2 },
  { href: `mailto:${profile.email}`, label: "Email", Icon: Mail },
].filter((social) => !!social.href);

const linkClass = "text-muted transition-colors hover:text-foreground";

export default function Footer() {
  return (
    <footer className="print:hidden mt-20 border-t border-border">
      {/*
        One row: links on the left, contact actions on the right. It wraps rather than
        overflowing — the previous single-row footer used a no-wrap flex line, so on a
        phone the last few links ran past the edge and were clipped by the page's
        overflow rule.
      */}
      <div className={`${PAGE_CONTAINER} flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-6 md:justify-between`}>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {footerLinks.map((link) =>
            link.external ? (
              <a
                key={link.id}
                href={resolveCvHref(link)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => link.name === "CV" && trackEvent("resume_view", { location: "footer" })}
                className={linkClass}
              >
                {link.name}
              </a>
            ) : (
              <Link key={link.id} href={link.href} className={linkClass}>
                {link.name}
              </Link>
            )
          )}
          {/* Not a nav item: it belongs in the footer, not the main menu. */}
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          {socials.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={label === "Email" ? `Email ${profile.name}` : `${profile.name} on ${label}`}
              title={label}
              // 40px target: these used to be bare 20px glyphs, awkward to hit on a phone.
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}

          {profile.bookingUrl && (
            <a
              href={profile.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("booking_click", { location: "footer" })}
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground"
            >
              <CalendarDays size={16} aria-hidden="true" />
              {t.bookCallLabel}
            </a>
          )}

          <a
            href={profile.social.upwork}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("hire_me_click", { location: "footer" })}
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <Handshake size={16} aria-hidden="true" />
            {t.hireMeLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
