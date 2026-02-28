import { Metadata } from "next";
import Projects from "@/components/sections/Projects";

export const metadata: Metadata = {
  title: "Projects | Portfolio",
  description: "A showcase of my projects and work",
};

export default function ProjectsPage() {
  return (
    <div className="pt-16">
      <Projects showAll />
    </div>
  );
}
