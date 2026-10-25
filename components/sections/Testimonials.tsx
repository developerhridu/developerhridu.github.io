import TestimonialsGrid from "@/components/sections/TestimonialsGrid";
import { getPublishedTestimonials } from "@/lib/testimonials";

interface TestimonialsProps {
  showHeading?: boolean;
  noSection?: boolean;
  headingAs?: "h1" | "h2";
}

/**
 * Server half of the testimonials section. It exists only to filter the data before it
 * reaches the browser: when the client component imported content/testimonials.json
 * itself, the whole file — unpublished entries and their real email addresses included —
 * was bundled into the public JS, even though only published ones were rendered.
 */
export default function Testimonials({ showHeading = true, noSection = false, headingAs = "h2" }: TestimonialsProps) {
  const testimonials = getPublishedTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <TestimonialsGrid
      testimonials={testimonials}
      showHeading={showHeading}
      noSection={noSection}
      headingAs={headingAs}
    />
  );
}
