import { ExternalLink, Github } from "lucide-react";
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
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <ExternalLink size={16} />
            {t.viewLive}
          </a>
        </div>
      )}

      {typeof githubUrl === "string" && githubUrl && (
        <div>
          <p className={labelClass}>{t.sourceCode}</p>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Github size={16} />
            {t.viewCode}
          </a>
        </div>
      )}

      {hasGithubObject && (
        <div>
          <p className={labelClass}>{t.sourceCode}</p>
          <div className="flex flex-col gap-1.5">
            {(githubUrl as { frontend?: string }).frontend && (
              <a
                href={(githubUrl as { frontend?: string }).frontend}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Github size={16} />
                {t.frontEnd}
              </a>
            )}
            {(githubUrl as { backend?: string }).backend && (
              <a
                href={(githubUrl as { backend?: string }).backend}
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
  );
}
