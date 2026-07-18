import { Metadata } from "next";
import TestimonialSubmit from "@/components/sections/TestimonialSubmit";

export const metadata: Metadata = {
  title: "Share Your Experience | Mizanur Rahman",
  description: "Submit a testimonial about working with Mizanur Rahman.",
};

export default function TestimonialSubmitPage() {
  return (
    <div className="pt-16 md:pt-0">
      <TestimonialSubmit />
    </div>
  );
}
