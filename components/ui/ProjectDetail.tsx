import { ExternalLink, Github, Building2 } from "lucide-react";
import LightboxImage from "@/components/ui/LightboxImage";
import uiStrings from "@/content/ui-strings.json";

const t = uiStrings.projectModal;

interface ProjectDetailProps {
  project: {
    title: string;
    description: string;
    longDescription?: string;
    image?: string;
    client?: string;
    tags: string[];
    liveUrl?: string | null;
    githubUrl?: string | null | { frontend?: string; backend?: string };
  };
  as?: "h1" | "h2";
  imageWrapperClassName?: string;
  titleClassName?: string;
}

export default function ProjectDetail({
  project,
  as: Heading = "h2",
  imageWrapperClassName = "h-56 md:h-80",
  titleClassName = "text-2xl md:text-3xl",
}: ProjectDetailProps) {
  const linkClass =
    "flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors";
  const linkLabelClass = "text-xs uppercase tracking-wide text-muted mb-1";

  return (
    <>
      <LightboxImage
        src={project.image}
        alt={project.title}
        wrapperClassName={imageWrapperClassName}
        initials={project.title.split(" ").map((w) => w[0]).join("")}
        initialsClassName="text-6xl"
      />

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded text-xs uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>

        <Heading className={`${titleClassName} font-bold text-foreground mb-2`}>
          {project.title}
        </Heading>

        {project.client && (
          <p className="flex items-center gap-2 text-sm text-muted mb-4">
            <Building2 size={16} />
            {project.client}
          </p>
        )}

        <p className="text-muted mb-2">{project.description}</p>
        {project.longDescription && (
          <p className="text-muted text-sm mb-6">{project.longDescription}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
          {project.liveUrl && (
            <div>
              <p className={linkLabelClass}>{t.liveDemo}</p>
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <ExternalLink size={16} />
                {t.viewLive}
              </a>
            </div>
          )}

          {typeof project.githubUrl === "string" && project.githubUrl && (
            <div>
              <p className={linkLabelClass}>{t.sourceCode}</p>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Github size={16} />
                {t.viewCode}
              </a>
            </div>
          )}

          {project.githubUrl && typeof project.githubUrl === "object" && (
            <div>
              <p className={linkLabelClass}>{t.sourceCode}</p>
              <div className="flex flex-col gap-1.5">
                {project.githubUrl.frontend && (
                  <a
                    href={project.githubUrl.frontend}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <Github size={16} />
                    {t.frontEnd}
                  </a>
                )}
                {project.githubUrl.backend && (
                  <a
                    href={project.githubUrl.backend}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    <Github size={16} />
                    {t.backEnd}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
