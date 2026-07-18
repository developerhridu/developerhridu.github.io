import { Metadata } from "next";
import {
  getProfile,
  getExperiences,
  getProjects,
  getEducation,
  getCertifications,
  getSkillsCategory,
} from "@/lib/content";
import PrintButton from "@/components/ui/PrintButton";
import ContentImage from "@/components/ui/ContentImage";
import { Mail, Phone, MapPin, Github, Linkedin, Code2, Globe, ExternalLink } from "lucide-react";
import type { SkillsCategory } from "@/types";

const BASE_URL = "https://developerhridu.github.io";

export const metadata: Metadata = {
  title: "Resume | Mizanur Rahman — Full-Stack Software Engineer",
  description:
    "Live, always up-to-date resume: experience, technical skills, projects, education, and certifications.",
  alternates: { canonical: `${BASE_URL}/resume` },
  openGraph: {
    title: "Resume | Mizanur Rahman",
    description: "Live, always up-to-date resume for Mizanur Rahman, Full-Stack Software Engineer.",
    type: "profile",
    url: `${BASE_URL}/resume`,
    images: [{ url: `${BASE_URL}/images/profile/dp.png`, width: 400, height: 400, alt: "Mizanur Rahman" }],
  },
  twitter: {
    card: "summary",
    title: "Resume | Mizanur Rahman",
    description: "Live, always up-to-date resume for Mizanur Rahman, Full-Stack Software Engineer.",
    images: [`${BASE_URL}/images/profile/dp.png`],
  },
};

const SKILL_LABELS: [keyof SkillsCategory, string][] = [
  ["backend", "Backend"],
  ["architecture", "Architecture"],
  ["messaging", "Messaging & Caching"],
  ["frontend", "Frontend"],
  ["database", "Database"],
  ["devops", "DevOps & Observability"],
  ["testing", "Testing"],
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground pb-2 mb-4 border-b-2 border-accent">
      {children}
    </h2>
  );
}

export default function ResumePage() {
  const profile = getProfile();
  const experiences = getExperiences();
  const education = getEducation();
  const certifications = getCertifications();
  const skills = getSkillsCategory();
  const personalProjects = getProjects().filter((p) => p.githubUrl);
  const summary = profile.bio.split("\n\n")[0];

  return (
    <div className="pt-16 md:pt-0 print:pt-0">
      <section className="py-12 print:py-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0 print:max-w-none">
          <div className="flex justify-end mb-6 print:hidden">
            <PrintButton />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 md:p-12 print:bg-white print:text-black print:border-none print:rounded-none print:p-0">
            {/* Header */}
            <header className="mb-10 print:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="sm:flex-1 sm:min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground print:text-black mb-2">
                  {profile.name}
                </h1>
                <p className="text-lg text-accent print:text-black mb-4">{profile.title}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted print:text-black">
                  {profile.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} /> {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {profile.location}
                  </span>
                  {profile.social.github && (
                    <a
                      href={profile.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-accent print:text-black"
                    >
                      <Github size={14} /> GitHub
                    </a>
                  )}
                  {profile.social.linkedin && (
                    <a
                      href={profile.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-accent print:text-black"
                    >
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {profile.social.leetcode && (
                    <a
                      href={profile.social.leetcode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-accent print:text-black"
                    >
                      <Code2 size={14} /> LeetCode
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-accent print:text-black"
                    >
                      <Globe size={14} /> Portfolio
                    </a>
                  )}
                </div>
              </div>

              <ContentImage
                src={profile.avatar}
                alt={profile.name}
                wrapperClassName="w-24 h-24 md:w-28 md:h-28 rounded-full shrink-0 order-first sm:order-last mx-auto sm:mx-0 print:border print:border-border"
                imgClassName="w-full h-full object-cover"
                initials={profile.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              />
            </header>

            {/* Summary */}
            {summary && (
              <section className="mb-10 print:mb-8">
                <SectionHeading>Summary</SectionHeading>
                <p className="text-muted print:text-black leading-relaxed">{summary}</p>
              </section>
            )}

            {/* Technical Skills */}
            <section className="mb-10 print:mb-8">
              <SectionHeading>Technical Skills</SectionHeading>
              <div className="space-y-1.5">
                {SKILL_LABELS.map(([key, label]) => {
                  const values = skills[key];
                  if (!values || values.length === 0) return null;
                  return (
                    <p key={key} className="text-sm text-muted print:text-black">
                      <span className="font-semibold text-foreground print:text-black">{label}:</span>{" "}
                      {values.join(", ")}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Experience */}
            <section className="mb-10 print:mb-8">
              <SectionHeading>Experience</SectionHeading>
              <div className="space-y-8">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="font-bold text-foreground print:text-black">{exp.company}</h3>
                      <span className="text-sm text-muted print:text-black">{exp.period}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 mb-2">
                      <p className="text-accent print:text-black italic">{exp.role}</p>
                      {exp.location && (
                        <span className="text-sm text-muted print:text-black">{exp.location}</span>
                      )}
                    </div>
                    <div className="space-y-4">
                      {exp.projects.map((project) => (
                        <div key={project.name}>
                          <h4 className="text-sm font-semibold text-foreground print:text-black italic">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-sm text-muted print:text-black mb-1">
                              {project.description}
                            </p>
                          )}
                          {project.technologies.length > 0 && (
                            <p className="text-xs text-muted print:text-black mb-1">
                              <span className="font-semibold text-foreground print:text-black">
                                Tech-Stack:
                              </span>{" "}
                              {project.technologies.join(", ")}
                            </p>
                          )}
                          {project.highlights.length > 0 && (
                            <ul className="space-y-1">
                              {project.highlights.map((h, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted print:text-black flex items-start gap-2"
                                >
                                  <span className="text-accent print:text-black mt-1">•</span>
                                  {h}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Projects */}
            {personalProjects.length > 0 && (
              <section className="mb-10 print:mb-8">
                <SectionHeading>Projects</SectionHeading>
                <div className="space-y-4">
                  {personalProjects.map((project) => (
                    <div key={project.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <h3 className="font-bold text-foreground print:text-black">{project.title}</h3>
                        <span className="flex items-center gap-3 text-sm">
                          {typeof project.githubUrl === "string" && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-accent print:text-black hover:underline"
                            >
                              Code <ExternalLink size={12} />
                            </a>
                          )}
                          {project.githubUrl && typeof project.githubUrl === "object" && (
                            <>
                              {project.githubUrl.frontend && (
                                <a
                                  href={project.githubUrl.frontend}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-accent print:text-black hover:underline"
                                >
                                  Frontend <ExternalLink size={12} />
                                </a>
                              )}
                              {project.githubUrl.backend && (
                                <a
                                  href={project.githubUrl.backend}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-accent print:text-black hover:underline"
                                >
                                  Backend <ExternalLink size={12} />
                                </a>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted print:text-black mb-1">{project.description}</p>
                      {project.tags.length > 0 && (
                        <p className="text-xs text-muted print:text-black">
                          <span className="font-semibold text-foreground print:text-black">
                            Tech-Stack:
                          </span>{" "}
                          {project.tags.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            <section className="mb-10 print:mb-8">
              <SectionHeading>Education</SectionHeading>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.institution}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="font-bold text-foreground print:text-black">{edu.institution}</h3>
                      <span className="text-sm text-muted print:text-black">{edu.period}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="text-sm text-muted print:text-black">
                        {edu.degree}
                        {edu.cgpa && ` (CGPA – ${edu.cgpa})`}
                      </p>
                      <span className="text-sm text-muted print:text-black">{edu.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Training & Certifications */}
            {certifications.length > 0 && (
              <section>
                <SectionHeading>Training and Certifications</SectionHeading>
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm"
                    >
                      <p className="text-foreground print:text-black">
                        <span className="font-semibold">{cert.name}</span>{" "}
                        <span className="text-muted print:text-black">— {cert.issuer}</span>
                        {cert.verifyUrl && (
                          <a
                            href={cert.verifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-accent print:text-black hover:underline"
                          >
                            [Verify]
                          </a>
                        )}
                      </p>
                      <span className="text-muted print:text-black whitespace-nowrap">{cert.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
