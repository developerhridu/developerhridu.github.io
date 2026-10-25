import testimonialsData from "@/content/testimonials.json";
import type { Testimonial } from "@/types";
import { isPublished } from "@/lib/published";

const TESTIMONIALS = (testimonialsData.testimonials || []) as Testimonial[];

/** All testimonials, including unpublished ones — the admin moderation list needs these. */
export function getTestimonials(): Testimonial[] {
  return TESTIMONIALS;
}

/**
 * Published testimonials only.
 *
 * Call this from a server component, never from a client one: a client component that
 * imports content/testimonials.json puts the *whole* file in the JS bundle, unpublished
 * entries and the real email addresses of people awaiting moderation included, however it
 * filters them afterwards. Filtering on the server and passing the result as props is what
 * actually keeps that data off the wire.
 */
export function getPublishedTestimonials(): Testimonial[] {
  return TESTIMONIALS.filter(isPublished);
}
