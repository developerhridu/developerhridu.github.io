import { Metadata } from "next";
import Projects from "@/components/sections/Projects";

export const metadata: Metadata = {
  title: "Projects | Mizanur Rahman — Portfolio",
  description:
    "Real-world backend projects: multi-tenant OTA platform, food delivery CRM, fare intelligence engine, and job portal modernization using .NET, microservices, and cloud-native patterns.",
};

export default function ProjectsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Projects showAll />
    </div>
  );
}
