export function resolveCvHref(link: { id: string; href: string }, resumeUrl: string): string {
  return link.id === "cv" ? resumeUrl : link.href;
}
