import { Metadata } from "next";
import Experience from "@/components/sections/Experience";

export const metadata: Metadata = {
  title: "Experience | Mizanur Rahman — Career Journey",
  description:
    "4+ years across TechnoNext Software (US-Bangla Group), Bdjobs.com, and E-Desh Limited. Built production systems in travel, recruitment, and logistics sectors.",
};

export default function ExperiencePage() {
  return (
    <div className="pt-16 md:pt-0">
      <Experience />
    </div>
  );
}
