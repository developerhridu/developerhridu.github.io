"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
    >
      <Printer size={16} />
      Print / Save as PDF
    </button>
  );
}
