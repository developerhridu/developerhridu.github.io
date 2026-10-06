"use client";

import { useEffect, useState } from "react";
import { TOKEN_CHANGED_EVENT, TOKEN_KEY } from "@/components/admin/shared";

export default function useValidGitHubToken() {
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    let controller: AbortController | undefined;

    async function validateToken() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setHasValidToken(false);

      try {
        const token = localStorage.getItem(TOKEN_KEY)?.trim();
        if (!token) return;

        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
          signal: request.signal,
        });

        if (!request.signal.aborted) {
          setHasValidToken(response.ok && localStorage.getItem(TOKEN_KEY)?.trim() === token);
        }
      } catch {
        if (!request.signal.aborted) setHasValidToken(false);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === TOKEN_KEY || event.key === null) void validateToken();
    }

    void validateToken();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(TOKEN_CHANGED_EVENT, validateToken);
    window.addEventListener("focus", validateToken);
    return () => {
      controller?.abort();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TOKEN_CHANGED_EVENT, validateToken);
      window.removeEventListener("focus", validateToken);
    };
  }, []);

  return hasValidToken;
}
