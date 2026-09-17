import sectionsData from "@/content/sections.json";
import type { SectionCopy } from "@/types";

const sections = sectionsData.sections as SectionCopy[];

export function getSectionCopy(id: string): SectionCopy {
  return sections.find((s) => s.id === id) ?? { id, title: "" };
}
