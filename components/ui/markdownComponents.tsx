import type { Components } from "react-markdown";
import LinkedInEmbed from "@/components/ui/LinkedInEmbed";
import ArticleCodeBlock from "@/components/ui/ArticleCodeBlock";
import { extractLinkedInActivityId } from "@/lib/linkedin";

interface CodeElementProps {
  className?: string;
  children?: unknown;
}

function isCodeElement(node: unknown): node is { props: CodeElementProps } {
  return typeof node === "object" && node !== null && "props" in node;
}

/**
 * Shared react-markdown overrides for article bodies. A linkedin fence renders
 * as a live embed; other fenced blocks render as copyable, highlighted code.
 */
export const markdownComponents: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;
    const language = isCodeElement(child)
      ? child.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1]
      : undefined;
    const code = isCodeElement(child) ? String(child.props.children ?? "").replace(/\n$/, "") : "";

    if (language === "linkedin") {
      const url = code.trim();
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

    return <ArticleCodeBlock code={code} language={language} />;
  },
};
