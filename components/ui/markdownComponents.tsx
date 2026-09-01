import type { Components } from "react-markdown";
import LinkedInEmbed from "@/components/ui/LinkedInEmbed";
import { extractLinkedInActivityId } from "@/lib/linkedin";

interface CodeElementProps {
  className?: string;
  children?: unknown;
}

function isCodeElement(node: unknown): node is { props: CodeElementProps } {
  return typeof node === "object" && node !== null && "props" in node;
}

/**
 * Shared react-markdown overrides for blog posts and case studies. Currently handles
 * one special fenced block: ```linkedin\n<post url>\n``` renders as a live embed
 * instead of a code snippet, by pulling the activity id out of the plain post URL.
 */
export const markdownComponents: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;

    if (isCodeElement(child) && child.props.className?.includes("language-linkedin")) {
      const url = String(child.props.children ?? "").trim();
      const activityId = extractLinkedInActivityId(url);
      if (activityId) {
        return <LinkedInEmbed activityId={activityId} />;
      }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          View post on LinkedIn
        </a>
      );
    }

    return <pre>{children}</pre>;
  },
};
