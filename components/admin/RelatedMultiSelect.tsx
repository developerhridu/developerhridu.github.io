"use client";

import Image from "next/image";
import projectsData from "@/content/projects.json";
import caseStudiesData from "@/content/case-studies.json";
import blogsData from "@/content/blogs.json";
import clientsData from "@/content/clients.json";
import MultiSelectDropdown from "@/components/admin/MultiSelectDropdown";
import type { MultiSelectOption } from "@/components/admin/MultiSelectDropdown";
import type { RelatedRefs } from "@/types";

interface PickableItem {
  slug: string;
  title?: string;
  name?: string;
  image?: string;
  published?: boolean;
}

type RefKey = keyof RelatedRefs;

/** Each pickable type: the `RelatedRefs` key it is stored under, its option-value prefix, and label. */
const GROUPS: { key: RefKey; prefix: string; label: string; items: PickableItem[] }[] = [
  { key: "projects", prefix: "project:", label: "Project", items: projectsData.projects as PickableItem[] },
  { key: "caseStudies", prefix: "case-study:", label: "Case Study", items: caseStudiesData.caseStudies as PickableItem[] },
  { key: "blogs", prefix: "blog:", label: "Blog", items: blogsData.posts as PickableItem[] },
  { key: "clients", prefix: "client:", label: "Client", items: clientsData.clients as PickableItem[] },
];

const OPTIONS: MultiSelectOption[] = GROUPS.flatMap(({ prefix, label, items }) =>
  items.map((item) => ({
    value: `${prefix}${item.slug}`,
    label: `${label}: ${item.title ?? item.name ?? item.slug}`,
    icon: item.image ? (
      <span className="relative w-4 h-4 shrink-0 mt-0.5 rounded bg-white/90 overflow-hidden">
        <Image src={item.image} alt="" fill sizes="16px" className="object-cover" />
      </span>
    ) : undefined,
    note:
      item.published === false ? (
        <span className="ml-1.5 text-xs text-yellow-500">(draft — won&apos;t show)</span>
      ) : undefined,
  }))
);

interface RelatedMultiSelectProps {
  value: RelatedRefs;
  onChange: (value: Required<RelatedRefs>) => void;
  /** Option value of the item being edited (e.g. "blog:my-post"), hidden so it can't relate to itself. */
  exclude?: string;
}

/** One dropdown for picking related projects, case studies, blog posts, and clients. */
export default function RelatedMultiSelect({ value, onChange, exclude }: RelatedMultiSelectProps) {
  const selected = GROUPS.flatMap(({ key, prefix }) => (value[key] ?? []).map((slug) => `${prefix}${slug}`));

  return (
    <MultiSelectDropdown
      options={exclude ? OPTIONS.filter((option) => option.value !== exclude) : OPTIONS}
      selected={selected}
      onChange={(next) => onChange(Object.fromEntries(
        GROUPS.map(({ key, prefix }) => [
          key,
          next.filter((option) => option.startsWith(prefix)).map((option) => option.slice(prefix.length)),
        ])
      ) as Required<RelatedRefs>)}
      placeholder="Select projects, case studies, blogs, clients…"
      emptyMessage="Nothing to link yet."
    />
  );
}
