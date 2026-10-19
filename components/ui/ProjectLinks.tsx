import { ExternalLink, Github } from "lucide-react";
import TrackedLink from "@/components/ui/TrackedLink";
import uiStrings from "@/content/ui-strings.json";

const t = uiStrings.projectModal;

interface ProjectLinksProps {
  liveUrl?: string | null;
  githubUrl?: string | null | { frontend?: string; backend?: string };
  className?: string;
}

const linkClass = "flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors";
const labelClass = "text-xs uppercase tracking-wide text-muted mb-1";

export default function ProjectLinks({ liveUrl, githubUrl, className = "" }: ProjectLinksProps) {
  const hasGithubObject = !!githubUrl && typeof githubUrl === "object";
  const hasAny = !!liveUrl || (typeof githubUrl === "string" && !!githubUrl) || hasGithubObject;

  if (!hasAny) return null;

  return (
    <div className={`grid sm:grid-cols-2 gap-6 pt-6 border-t border-border ${className}`}>
      {liveUrl && (
        <div>
          <p className={labelClass}>{t.liveDemo}</p>
          <TrackedLink href={liveUrl} area="outbound" label="live-demo" target="_blank" className={linkClass}>
            <ExternalLink size={16} />
            {t.viewLive}
          </TrackedLink>
        </div>
      )}

      {typeof githubUrl === "string" && githubUrl && (
        <div>
          <p className={labelClass}>{t.sourceCode}</p>
          <TrackedLink href={githubUrl} area="outbound" label="github" target="_blank" className={linkClass}>
            <Github size={16} />
            {t.viewCode}
          </TrackedLink>
        </div>
      )}

      {hasGithubObject && (
        <div>
          <p className={labelClass}>{t.sourceCode}</p>
          <div className="flex flex-col gap-1.5">
            {(githubUrl as { frontend?: string }).frontend && (
              <TrackedLink
                href={(githubUrl as { frontend: string }).frontend}
                area="outbound"
                label="github-frontend"
                target="_blank"
                className={linkClass}
              >
                <Github size={16} />
                {t.frontEnd}
              </TrackedLink>
            )}
            {(githubUrl as { backend?: string }).backend && (
              <TrackedLink
                href={(githubUrl as { backend: string }).backend}
                area="outbound"
                label="github-backend"
                target="_blank"
                className={linkClass}
              >
                <Github size={16} />
                {t.backEnd}
              </TrackedLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
