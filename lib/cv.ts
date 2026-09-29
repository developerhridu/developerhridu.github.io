/** The "cv" nav entry has no href of its own — it points at the live, JSON-driven
 *  /resume page rather than the uploaded PDF, which goes stale the moment content changes. */
export function resolveCvHref(link: { id: string; href: string }): string {
  return link.id === "cv" ? "/resume" : link.href;
}
