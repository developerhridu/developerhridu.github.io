import { Metadata } from "next";
import About from "@/components/sections/About";
import Education from "@/components/sections/Education";
import Certifications from "@/components/sections/Certifications";

export const metadata: Metadata = {
  title: "About | Portfolio",
  description: "Learn more about me, my skills, and my background",
};

export default function AboutPage() {
  return (
    <div className="pt-16">
      <About />
      <Education />
      <Certifications />
    </div>
  );
}
