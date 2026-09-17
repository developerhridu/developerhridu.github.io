import { Metadata } from "next";
import Contact from "@/components/sections/Contact";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("contact");

export default function ContactPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Contact />
    </div>
  );
}
