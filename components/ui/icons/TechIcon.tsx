"use client";

import {
  Activity,
  Boxes,
  Building2,
  Code2,
  Database,
  FileCode,
  Filter,
  FlaskConical,
  Hash,
  Layers,
  Plug,
  Split,
  Timer,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { brandIcons, type BrandSlug } from "@/components/ui/icons/techBrandPaths";

/** Skill name (lowercased) -> official brand mark. */
const BRAND: Record<string, BrandSlug> = {
  ".net core": "dotnet",
  "asp.net mvc": "dotnet",
  rabbitmq: "rabbitmq",
  kafka: "apachekafka",
  redis: "redis",
  angular: "angular",
  typescript: "typescript",
  javascript: "javascript",
  react: "react",
  "html/css": "html5",
  bootstrap: "bootstrap",
  postgresql: "postgresql",
  mongodb: "mongodb",
  docker: "docker",
  git: "git",
  github: "github",
  "github actions": "githubactions",
  "gitlab ci/cd": "gitlab",
  elasticsearch: "elasticsearch",
  jasmine: "jasmine",
  postman: "postman",
  jmeter: "apachejmeter",
  k6: "k6",
};

/** Skill name (lowercased) -> lucide glyph, for concepts and tools with no brand mark. */
const GENERIC: Record<string, LucideIcon> = {
  "c#": Hash,
  "ef core": Database,
  dapper: Database,
  linq: Filter,
  "api integration": Plug,
  "rest apis": Webhook,
  soap: FileCode,
  microservices: Boxes,
  "clean architecture": Layers,
  cqrs: Split,
  "multi-tenant saas": Building2,
  "event-driven design": Zap,
  hangfire: Timer,
  "mssql server": Database,
  xunit: FlaskConical,
  mstest: FlaskConical,
  apm: Activity,
};

const FALLBACK = Code2;

interface TechIconProps {
  name: string;
  className?: string;
}

export default function TechIcon({ name, className = "w-3.5 h-3.5 shrink-0" }: TechIconProps) {
  const key = name.trim().toLowerCase();

  const slug = BRAND[key];
  if (slug) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        <path d={brandIcons[slug].path} />
      </svg>
    );
  }

  const Icon = GENERIC[key] ?? FALLBACK;
  return <Icon className={className} aria-hidden="true" />;
}
