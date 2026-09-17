import { Metadata } from "next";
import Certifications from "@/components/sections/Certifications";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("certifications");

export default function CertificationsPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Certifications />
    </div>
  );
}
