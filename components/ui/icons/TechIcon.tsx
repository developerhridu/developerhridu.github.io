"use client";

import {
  Activity,
  Boxes,
  Building2,
  Cloud,
  Code2,
  Combine,
  Database,
  FileCode,
  Filter,
  FlaskConical,
  Layers,
  Plug,
  Split,
  TestTube2,
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
  "asp.net core": "dotnet",
  rabbitmq: "rabbitmq",
  kafka: "apachekafka",
  redis: "redis",
  angular: "angular",
  typescript: "typescript",
  javascript: "javascript",
  react: "react",
  "react/next": "react",
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

interface CustomIcon {
  path: string;
  /** Defaults to "0 0 24 24" (the simple-icons/lucide convention) when omitted. */
  viewBox?: string;
}

/** Icons sourced outside simple-icons/lucide, each with its own path + license note. */
const CUSTOM_PATHS: Record<string, CustomIcon> = {
  // Material Design Icons "language-csharp" (Apache-2.0, pictogrammers.com) — simple-icons
  // ships no C# mark since Microsoft doesn't publish one under a redistributable license.
  "c#": {
    path: "M11.5,15.97L11.91,18.41C11.65,18.55 11.23,18.68 10.67,18.8C10.1,18.93 9.43,19 8.66,19C6.45,18.96 4.79,18.3 3.68,17.04C2.56,15.77 2,14.16 2,12.21C2.05,9.9 2.72,8.13 4,6.89C5.32,5.64 6.96,5 8.94,5C9.69,5 10.34,5.07 10.88,5.19C11.42,5.31 11.82,5.44 12.08,5.59L11.5,8.08L10.44,7.74C10.04,7.64 9.58,7.59 9.05,7.59C7.89,7.58 6.93,7.95 6.18,8.69C5.42,9.42 5.03,10.54 5,12.03C5,13.39 5.37,14.45 6.08,15.23C6.79,16 7.79,16.4 9.07,16.41L10.4,16.29C10.83,16.21 11.19,16.1 11.5,15.97M13.89,19L14.5,15H13L13.34,13H14.84L15.16,11H13.66L14,9H15.5L16.11,5H18.11L17.5,9H18.5L19.11,5H21.11L20.5,9H22L21.66,11H20.16L19.84,13H21.34L21,15H19.5L18.89,19H16.89L17.5,15H16.5L15.89,19H13.89M16.84,13H17.84L18.16,11H17.16L16.84,13Z",
  },
  // devicon "oracle-original" (MIT, devicon.dev) — Oracle has no mark in simple-icons.
  // Authored on a 128x128 grid, unlike every other icon here, hence the explicit viewBox.
  oracle: {
    path: "M55.387 66.469h8.333l-4.407-7.09-8.088 12.819h-3.681L57.382 56.8a2.324 2.324 0 011.931-.998c.765 0 1.478.363 1.892.972l9.876 15.424H67.4l-1.736-2.865h-8.438l-1.839-2.864zm38.235 2.864V55.958h-3.123v14.685c0 .402.156.791.454 1.089.298.298.7.466 1.141.466h14.244l1.841-2.865H93.622zm-51.677-2.397c3.033 0 5.496-2.449 5.496-5.482s-2.462-5.496-5.496-5.496H28.28v16.241h3.123V58.822h10.335c1.452 0 2.618 1.18 2.618 2.631s-1.167 2.631-2.618 2.631l-8.806-.013 9.324 8.127h4.538l-6.274-5.263h1.425zM9.059 72.198c-4.483 0-8.122-3.629-8.122-8.114s3.638-8.127 8.122-8.127h9.439c4.485 0 8.121 3.643 8.121 8.127s-3.636 8.114-8.121 8.114H9.059zm9.229-2.865a5.25 5.25 0 005.258-5.249 5.262 5.262 0 00-5.258-5.263H9.267a5.262 5.262 0 00-5.256 5.263 5.25 5.25 0 005.256 5.249h9.021zm59.314 2.865c-4.484 0-8.126-3.629-8.126-8.114s3.642-8.127 8.126-8.127h11.212l-1.829 2.864H77.81a5.267 5.267 0 00-5.264 5.263c0 2.903 2.36 5.249 5.264 5.249h11.263l-1.84 2.865h-9.631zm38.197-2.865a5.25 5.25 0 01-5.055-3.824h13.35l1.84-2.864h-15.19a5.266 5.266 0 015.055-3.824h9.163l1.854-2.864h-11.225c-4.484 0-8.126 3.643-8.126 8.127s3.642 8.114 8.126 8.114h9.631l1.841-2.865h-11.264",
    viewBox: "0 0 128 128",
  },
};

/** Skill name (lowercased) -> lucide glyph, for concepts and tools with no brand mark. */
const GENERIC: Record<string, LucideIcon> = {
  "ef core": Database,
  "entity framework core": Database,
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
  "unit testing": TestTube2,
  "integration testing": Combine,
  apm: Activity,
  // simple-icons dropped the Amazon brand marks over trademark policy.
  aws: Cloud,
};

const FALLBACK = Code2;

interface TechIconProps {
  name: string;
  className?: string;
}

export default function TechIcon({ name, className = "w-3.5 h-3.5 shrink-0" }: TechIconProps) {
  const key = name.trim().toLowerCase();

  const slug = BRAND[key];
  const custom = slug ? undefined : CUSTOM_PATHS[key];
  const path = slug ? brandIcons[slug].path : custom?.path;
  if (path) {
    return (
      <svg
        viewBox={custom?.viewBox ?? "0 0 24 24"}
        fill="currentColor"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        <path d={path} />
      </svg>
    );
  }

  const Icon = GENERIC[key] ?? FALLBACK;
  return <Icon className={className} aria-hidden="true" />;
}
