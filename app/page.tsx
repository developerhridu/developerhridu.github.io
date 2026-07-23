import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import CaseStudies from "@/components/sections/CaseStudies";
import Experience from "@/components/sections/Experience";
import EducationCertifications from "@/components/sections/EducationCertifications";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import menu from "@/content/menu.json";

function isPublished(id: string): boolean {
  return menu.navLinks.find((link) => link.id === id)?.published !== false;
}

export default function Home() {
  return (
    <>
      <Hero />
      {isPublished("about") && <About />}
      {isPublished("services") && <Services />}
      {isPublished("experience") && <Experience />}
      {isPublished("projects") && <Projects />}
      {isPublished("case-studies") && <CaseStudies />}
      <EducationCertifications />
      {isPublished("testimonials") && <Testimonials />}
      {isPublished("contact") && <Contact />}
    </>
  );
}
