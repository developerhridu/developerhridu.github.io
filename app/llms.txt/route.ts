import profile from "@/content/profile.json";
import { searchIndex, type SearchItem } from "@/lib/searchIndex";

export const dynamic = "force-static";

const BASE_URL = "https://developerhridu.github.io";

function section(title: string, items: SearchItem[]): string {
  if (items.length === 0) return "";
  const lines = items.map((item) => `- [${item.title}](${BASE_URL}${item.url}): ${item.description}`);
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

export function GET() {
  const pages = searchIndex.filter((item) => item.category === "Page");
  const blogPosts = searchIndex.filter((item) => item.category === "Blog");
  const caseStudies = searchIndex.filter((item) => item.category === "Case Study");
  const projects = searchIndex.filter((item) => item.category === "Project");

  const sections = [
    section("Pages", pages),
    section("Blog Posts", blogPosts),
    section("Case Studies", caseStudies),
    section("Projects", projects),
  ]
    .filter(Boolean)
    .join("\n");

  const text = `# ${profile.name}

> ${profile.tagline}

${profile.title}, ${profile.location}. ${profile.bio.split("\n\n")[0]}

${sections}
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
