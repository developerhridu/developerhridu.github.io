import { Metadata } from "next";
import About from "@/components/sections/About";
import Education from "@/components/sections/Education";

export const metadata: Metadata = {
  title: "About | Mizanur Rahman — Full-Stack Software Engineer",
  description:
    "4+ years building scalable .NET microservices. Expertise in C#, ASP.NET Core, microservices architecture, and distributed systems across travel, food delivery, and recruitment domains.",
};

export default function AboutPage() {
  return (
    <div className="pt-16 md:pt-0">
      <About />
      <Education />
    </div>
  );
}
