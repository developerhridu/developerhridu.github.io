import { Metadata } from "next";
import Services from "@/components/sections/Services";
import { getSeo } from "@/lib/seo";

export const metadata: Metadata = getSeo("services");

export default function ServicesPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Services />
    </div>
  );
}
