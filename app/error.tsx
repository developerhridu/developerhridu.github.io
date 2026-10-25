"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

/**
 * Route-level error boundary. The site is client-component heavy, so without this an
 * exception in any one widget unmounts the whole route and leaves a blank page.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The static export has no server log, so the browser console is the only record.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 md:pt-0">
      <div className="text-center px-4">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Something went wrong</h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          This part of the page failed to load. Trying again usually fixes it — if it keeps
          happening, reloading the page will.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="primary">Try again</Button>
          <Button href="/" variant="secondary">Go home</Button>
        </div>
        {error.digest && (
          <p className="mt-6 font-mono text-xs text-muted">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
