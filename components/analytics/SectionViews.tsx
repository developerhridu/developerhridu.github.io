"use client";

import { useEffect } from "react";
import { trackSignal } from "@/lib/analytics";
import { oncePerSession, withinSignalBudget } from "@/lib/visitorSession";

/** A section counts as seen once this much of the viewport has been covered by it. */
const VISIBLE_RATIO = 0.4;

/**
 * Reports which of the home page's sections actually came into view.
 *
 * The section order is a judgement call, and this is the only way to check it: if nobody
 * scrolls as far as Testimonials or Contact, moving them up is worth more than rewriting
 * them. Each section reports once per session.
 */
export default function SectionViews() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("section[id]")];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          // Stop observing immediately: the first sighting is the only one of interest.
          observer.unobserve(entry.target);
          if (!id || !oncePerSession(`section:${id}`) || !withinSignalBudget()) continue;
          trackSignal("section-view", id);
        }
      },
      { threshold: VISIBLE_RATIO }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
