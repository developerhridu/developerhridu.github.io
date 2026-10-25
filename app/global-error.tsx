"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself, where app/error.tsx
 * cannot render. It replaces the whole document, so it carries its own <html>/<body> and
 * inline styles — the stylesheet may be exactly what failed.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1B2B",
          color: "#E6EDF3",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#8B949E", marginBottom: "2rem" }}>
            This page failed to load. Please reload to try again.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the router is part of what failed here; a full page load is the point */}
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              background: "#2F81F7",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
