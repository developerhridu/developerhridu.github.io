"use client";

import { Search } from "lucide-react";
import { dispatchOpenSearch } from "@/lib/searchEvent";

/** Gives the 404 page a way into search, which was previously a dead end. */
export default function SearchHint() {
  return (
    <button
      type="button"
      onClick={dispatchOpenSearch}
      className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
    >
      <Search size={14} aria-hidden="true" />
      Search the site
    </button>
  );
}
