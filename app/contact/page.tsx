import { Metadata } from "next";
import Contact from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Contact | Mizanur Rahman",
  description:
    "Open to backend engineering roles, consulting, and technical collaborations. Reach out via email or LinkedIn.",
};

export default function ContactPage() {
  return (
    <div className="pt-16 md:pt-0">
      <Contact />
    </div>
  );
}
