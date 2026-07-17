"use client";

import { useEffect, useRef } from "react";
import config from "@/content/config.json";

export default function Comments() {
  const ref = useRef<HTMLDivElement>(null);
  const { repo, repoId, category, categoryId } = config.giscus;

  useEffect(() => {
    if (!ref.current || !repo || !repoId || !category || !categoryId) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "en");
    script.crossOrigin = "anonymous";
    script.async = true;

    const container = ref.current;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [repo, repoId, category, categoryId]);

  if (!repo || !repoId || !category || !categoryId) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">Comments</h2>
      <div ref={ref} />
    </div>
  );
}
