import { Metadata } from "next";
import Projects from "@/components/sections/Projects";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("projects");

export default function ProjectsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Projects showAll />
    </div>
  );
}
