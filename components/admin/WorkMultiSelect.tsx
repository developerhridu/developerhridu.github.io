"use client";

import projectsData from "@/content/projects.json";
import caseStudiesData from "@/content/case-studies.json";
import MultiSelectDropdown from "@/components/admin/MultiSelectDropdown";
import type { MultiSelectOption } from "@/components/admin/MultiSelectDropdown";

interface WorkItem {
  slug: string;
  title: string;
  published?: boolean;
}

interface WorkMultiSelectProps {
  projects: string[];
  caseStudies: string[];
  onChange: (work: { projects: string[]; caseStudies: string[] }) => void;
}

const PROJECT_PREFIX = "project:";
const CASE_STUDY_PREFIX = "case-study:";

function toOptions(items: WorkItem[], prefix: string, kindLabel: string): MultiSelectOption[] {
  return items.map((item) => ({
    value: `${prefix}${item.slug}`,
    label: `${kindLabel}: ${item.title}`,
    note:
      item.published === false ? (
        <span className="ml-1.5 text-xs text-yellow-500">(draft — won&apos;t show)</span>
      ) : undefined,
  }));
}

const OPTIONS: MultiSelectOption[] = [
  ...toOptions(projectsData.projects as WorkItem[], PROJECT_PREFIX, "Project"),
  ...toOptions(caseStudiesData.caseStudies as WorkItem[], CASE_STUDY_PREFIX, "Case Study"),
];

function slugsWithPrefix(values: string[], prefix: string): string[] {
  return values.filter((value) => value.startsWith(prefix)).map((value) => value.slice(prefix.length));
}

/** One dropdown for picking the projects and case studies done for a client. */
export default function WorkMultiSelect({ projects, caseStudies, onChange }: WorkMultiSelectProps) {
  const selected = [
    ...projects.map((slug) => `${PROJECT_PREFIX}${slug}`),
    ...caseStudies.map((slug) => `${CASE_STUDY_PREFIX}${slug}`),
  ];

  return (
    <MultiSelectDropdown
      options={OPTIONS}
      selected={selected}
      onChange={(next) => onChange({
        projects: slugsWithPrefix(next, PROJECT_PREFIX),
        caseStudies: slugsWithPrefix(next, CASE_STUDY_PREFIX),
      })}
      placeholder="Select projects and case studies…"
      emptyMessage="No projects or case studies yet."
    />
  );
}
