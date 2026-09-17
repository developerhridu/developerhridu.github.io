import Button from "@/components/ui/Button";
import uiStrings from "@/content/ui-strings.json";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16 md:pt-0">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">{uiStrings.notFound.title}</h2>
        <p className="text-muted mb-8 max-w-md mx-auto">
          {uiStrings.notFound.body}
        </p>
        <Button href="/" variant="primary">{uiStrings.notFound.goHome}</Button>
      </div>
    </div>
  );
}
