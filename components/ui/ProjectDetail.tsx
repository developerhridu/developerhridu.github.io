import LightboxImage from "@/components/ui/LightboxImage";
import ProjectLinks from "@/components/ui/ProjectLinks";
import ClientLinks from "@/components/ui/ClientLinks";

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

        <ClientLinks client={project.client} className="text-sm mb-4" />

        <p className="text-muted mb-2">{project.description}</p>
        {project.longDescription && (
          <p className="text-muted text-sm mb-6">{project.longDescription}</p>
        )}

        <ProjectLinks liveUrl={project.liveUrl} githubUrl={project.githubUrl} />
      </div>
    </>
  );
}
