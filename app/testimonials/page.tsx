import { Metadata } from "next";
import Testimonials from "@/components/sections/Testimonials";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("testimonials");

export default function TestimonialsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Testimonials />
    </div>
  );
}
