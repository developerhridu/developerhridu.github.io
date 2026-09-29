import profile from "@/content/profile.json";

/** The "cv" nav entry has no href of its own — it points at the uploaded resume PDF
 *  (profile.resumeUrl), which opens in a new tab. Falls back to the live, JSON-driven
 *  /resume page when no PDF is configured. */
export function resolveCvHref(link: { id: string; href: string }): string {
  return link.id === "cv" ? profile.resumeUrl || "/resume" : link.href;
}
