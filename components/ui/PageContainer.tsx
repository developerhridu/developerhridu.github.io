import type { ReactNode } from "react";

/**
 * The site's one page width. Every page shell and section used to repeat
 * `max-w-6xl mx-auto px-4 sm:px-6` by hand, and four had drifted to other widths, so
 * pages did not line up with each other.
 *
 * Use this class (or the component below) for the outer container of a page or section.
 * It is deliberately not for inner measures: a paragraph, a form or a prose column should
 * still be narrower than the page, because long lines are harder to read.
 */
export const PAGE_CONTAINER = "max-w-6xl mx-auto px-4 sm:px-6";

export default function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${PAGE_CONTAINER} ${className}`.trim()}>{children}</div>;
}
