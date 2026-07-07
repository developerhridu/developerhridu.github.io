import { Metadata } from "next";
import Certifications from "@/components/sections/Certifications";

export const metadata: Metadata = {
  title: "Training & Certifications | Mizanur Rahman",
  description:
    "HackerRank, Coursera (Meta), and ICT Division certifications covering C#, SQL, JavaScript, REST APIs, React, and full-stack development.",
};

export default function CertificationsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Certifications />
    </div>
  );
}
