import { Metadata } from "next";
import EmployerCard from "@/components/ui/EmployerCard";
import { coverImages } from "@/lib/coverImages";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedEmployers } from "@/lib/employers";
import { getSeo } from "@/lib/seo";
import { getSectionCopy } from "@/lib/sections";

export const metadata: Metadata = getSeo("employers");

export default function EmployersPage() {
  const employers = getPublishedEmployers();
  const sectionCopy = getSectionCopy("employers");

  return (
    <div className="pt-16 md:pt-0">
      <section id="employers" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow={sectionCopy.eyebrow} title={sectionCopy.title} subtitle={sectionCopy.subtitle} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {employers.map((employer) => (
              <EmployerCard
                key={employer.id}
                employer={{
                  slug: employer.slug,
                  name: employer.name,
                  role: employer.role,
                  period: employer.period,
                  images: [...coverImages(employer), ...employer.proofOfWorkImages],
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
