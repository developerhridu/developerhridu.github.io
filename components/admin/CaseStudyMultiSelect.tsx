"use client";

import caseStudiesData from "@/content/case-studies.json";

interface CaseStudyMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CASE_STUDIES = (caseStudiesData.caseStudies ?? []) as {
  slug: string;
  title: string;
  published?: boolean;
}[];

export default function CaseStudyMultiSelect({ value, onChange }: CaseStudyMultiSelectProps) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function toggle(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChange(next.join(", "));
  }

  if (CASE_STUDIES.length === 0) {
    return <p className="text-muted text-xs">No case studies yet — add some in the Case Studies tab.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {CASE_STUDIES.map((study) => {
        const isSelected = selected.includes(study.slug);
        return (
          <label
            key={study.slug}
            className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
              isSelected
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggle(study.slug)}
              className="w-3.5 h-3.5 mt-0.5 shrink-0 accent-accent"
            />
            <span>
              {study.title}
              {study.published === false && (
                <span className="ml-1.5 text-xs text-yellow-500">(draft — won&apos;t show)</span>
              )}
              <span className="block font-mono text-xs opacity-60">{study.slug}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
