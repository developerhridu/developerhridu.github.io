"use client";

import Image from "next/image";
import { getClients, parseClientNames } from "@/lib/clients";
import MultiSelectDropdown from "@/components/admin/MultiSelectDropdown";
import type { MultiSelectOption } from "@/components/admin/MultiSelectDropdown";

interface ClientMultiSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClientMultiSelect({ value, onChange }: ClientMultiSelectProps) {
  const options: MultiSelectOption[] = getClients().map((client) => ({
    value: client.name,
    label: client.name,
    icon: client.logo ? (
      <span className="relative w-4 h-4 shrink-0 mt-0.5 rounded bg-white/90 overflow-hidden">
        <Image
          src={client.logo}
          alt=""
          fill
          sizes="16px"
          className="object-contain p-0.5"
        />
      </span>
    ) : undefined,
  }));

  return (
    <MultiSelectDropdown
      options={options}
      selected={parseClientNames(value)}
      onChange={(next) => onChange(next.join(", "))}
      placeholder="Select clients…"
      emptyMessage="No clients yet — add some in the Clients tab."
      caseInsensitive
    />
  );
}
