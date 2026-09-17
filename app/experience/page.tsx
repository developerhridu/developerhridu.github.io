import { Metadata } from "next";
import Experience from "@/components/sections/Experience";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("experience");

export default function ExperiencePage() {
  return (
    <div className="pt-16 md:pt-0">
      <Experience showAll />
    </div>
  );
}
