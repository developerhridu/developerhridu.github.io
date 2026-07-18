import { Metadata } from "next";
import Services from "@/components/sections/Services";

export const metadata: Metadata = {
  title: "Services | Mizanur Rahman — Full-Stack Software Engineer",
  description: "Backend, API, and microservices development services I offer.",
};

export default function ServicesPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Services />
    </div>
  );
}
