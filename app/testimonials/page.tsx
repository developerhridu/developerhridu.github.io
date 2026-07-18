import { Metadata } from "next";
import Testimonials from "@/components/sections/Testimonials";

export const metadata: Metadata = {
  title: "Testimonials | Mizanur Rahman — Full-Stack Software Engineer",
  description: "Feedback and recommendations from people I've worked with.",
};

export default function TestimonialsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Testimonials />
    </div>
  );
}
