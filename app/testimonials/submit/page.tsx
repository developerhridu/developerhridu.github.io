import { Metadata } from "next";
import TestimonialSubmit from "@/components/sections/TestimonialSubmit";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("testimonials-submit");

export default function TestimonialSubmitPage() {
  return (
    <div className="pt-16 md:pt-0">
      <TestimonialSubmit />
    </div>
  );
}
