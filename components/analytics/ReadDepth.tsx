"use client";

import { useEffect, useRef } from "react";
import { trackSignal, type SignalName } from "@/lib/analytics";
import { oncePerSession, withinSignalBudget } from "@/lib/visitorSession";

const MILESTONES: { fraction: number; signal: SignalName }[] = [
  { fraction: 0.25, signal: "scroll-25" },
  { fraction: 0.5, signal: "scroll-50" },
  { fraction: 0.75, signal: "scroll-75" },
  { fraction: 1, signal: "scroll-100" },
];

/**
 * Reports how far down an article someone actually got.
 *
 * Without this, a three-second bounce and a full read of a long case study are
 * indistinguishable — both are one view. Knowing that most readers stop at 25% of a
 * particular piece is the difference between "that post works" and "that post loses
 * people in the first screen".
 *
 * Each milestone fires at most once per article per session, and only while the session is
 * under its signal budget, so a reader scrolling up and down costs nothing extra.
 */
export default function ReadDepth({ slug }: { slug: string }) {
  /** Milestones already reported, kept in a ref so scrolling never re-renders. */
  const reported = useRef(new Set<number>());

  useEffect(() => {
    reported.current = new Set();
    let frame = 0;

    function measure() {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport can't be scrolled; opening it is a full read.
      const progress = scrollable > 0 ? (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight : 1;

      for (const { fraction, signal } of MILESTONES) {
        if (progress < fraction || reported.current.has(fraction)) continue;
        reported.current.add(fraction);
        // Namespaced per article so one piece reaching 100% can't be confused with another.
        if (oncePerSession(`${signal}:${slug}`) && withinSignalBudget()) trackSignal(signal, slug);
      }
    }

    function onScroll() {
      // One measurement per frame at most: scroll fires far more often than that.
      if (!frame) frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slug]);

  return null;
}
