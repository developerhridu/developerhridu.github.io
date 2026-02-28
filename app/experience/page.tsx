import { Metadata } from "next";
import Experience from "@/components/sections/Experience";
import Education from "@/components/sections/Education";

export const metadata: Metadata = {
  title: "Experience | Portfolio",
  description: "My professional experience and career journey",
};

export default function ExperiencePage() {
  return (
    <div className="pt-16">
      <Experience />
      <Education />
    </div>
  );
}
