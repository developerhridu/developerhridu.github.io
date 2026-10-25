import { Metadata } from "next";
import About from "@/components/sections/About";
import EducationCertifications from "@/components/sections/EducationCertifications";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("about");

export default function AboutPage() {
  return (
    <div className="pt-16 md:pt-0">
      <About headingAs="h1" />
      <EducationCertifications />
    </div>
  );
}
