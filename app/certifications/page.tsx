import { Metadata } from "next";
import Certifications from "@/components/sections/Certifications";

export const metadata: Metadata = {
  title: "Training & Certifications | Portfolio",
  description: "Courses and certifications I've completed",
};

export default function CertificationsPage() {
  return (
    <div className="pt-16">
      <Certifications />
    </div>
  );
}
