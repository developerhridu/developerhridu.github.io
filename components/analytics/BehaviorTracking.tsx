"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackSignal } from "@/lib/analytics";
import {
  getVisitorSession,
  oncePerSession,
  recordPageView,
  visitBucket,
  withinSignalBudget,
} from "@/lib/visitorSession";
import profile from "@/content/profile.json";

/** Enough of the contact details to tell a deliberate copy from an accidental selection. */
const CONTACT_FRAGMENTS = [profile.email, profile.phone].filter(Boolean).map((value) => String(value).toLowerCase());

/**
 * Site-wide behaviour tracking: where the visit came from, which pages it covers, whether
 * this browser has been here before, and whether anyone copies the contact details.
 *
 * Mounted once in the root layout and only in production, alongside GA and Clarity. The
 * acquisition and visit signals fire once per session, not per page, so navigating around
 * the site costs no extra requests.
 */
export default function BehaviorTracking() {
  const pathname = usePathname();

  // Acquisition and return-visitor signals: once per session.
  useEffect(() => {
    const session = getVisitorSession();

    if (oncePerSession("acquisition")) {
      // "direct" is worth recording too — it is the baseline everything else is measured against.
      trackSignal("referrer", session.referrer);
      if (session.campaign) trackSignal("campaign", session.campaign);
      trackSignal("visit", visitBucket(session.visit));
    }
  }, []);

  // The journey is only stored locally; it is sent if and when they get in touch.
  useEffect(() => {
    if (pathname) recordPageView(pathname);
  }, [pathname]);

  /**
   * Copying an email or phone number is a strong signal of intent that produces no click,
   * so nothing else on the site would ever see it.
   */
  useEffect(() => {
    function onCopy() {
      const selection = window.getSelection?.()?.toString().toLowerCase() ?? "";
      if (!selection || selection.length > 200) return;
      const matched = CONTACT_FRAGMENTS.find((fragment) => selection.includes(fragment));
      if (!matched) return;
      if (!oncePerSession("copy-contact") || !withinSignalBudget()) return;
      // The label says which detail, never the selection itself.
      trackSignal("copy-contact", matched.includes("@") ? "email" : "phone");
    }

    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, []);

  return null;
}
