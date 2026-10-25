import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import SearchHint from "@/components/ui/SearchHint";
import uiStrings from "@/content/ui-strings.json";

export const metadata: Metadata = {
  title: "Page not found",
  description: uiStrings.notFound.body,
  // Without this the 404 inherited the home page's metadata and invited indexing.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16 md:pt-0">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">{uiStrings.notFound.title}</h2>
        <p className="text-muted mb-8 max-w-md mx-auto">
          {uiStrings.notFound.body}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="primary">{uiStrings.notFound.goHome}</Button>
          <Button href="/blog" variant="secondary">Read the blog</Button>
          <Button href="/projects" variant="secondary">See projects</Button>
        </div>
        <SearchHint />
      </div>
    </div>
  );
}
