"use client";

import caseStudiesData from "@/content/case-studies.json";
import MultiSelectDropdown from "@/components/admin/MultiSelectDropdown";
import type { MultiSelectOption } from "@/components/admin/MultiSelectDropdown";

interface CaseStudyMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CASE_STUDIES = (caseStudiesData.caseStudies ?? []) as {
  slug: string;
  title: string;
  published?: boolean;
}[];

const OPTIONS: MultiSelectOption[] = CASE_STUDIES.map((study) => ({
  value: study.slug,
  label: study.title,
  note:
    study.published === false ? (
      <span className="ml-1.5 text-xs text-yellow-500">(draft — won&apos;t show)</span>
    ) : undefined,
}));

export default function CaseStudyMultiSelect({ value, onChange }: CaseStudyMultiSelectProps) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <MultiSelectDropdown
      options={OPTIONS}
      selected={selected}
      onChange={(next) => onChange(next.join(", "))}
      placeholder="Select case studies…"
      emptyMessage="No case studies yet — add some in the Case Studies tab."
    />
  );
}
