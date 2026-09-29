"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  /** Becomes the default filename the browser offers when saving as PDF. */
  documentName?: string;
}

export default function PrintButton({ documentName }: PrintButtonProps) {
  function handlePrint() {
    if (!documentName) {
      window.print();
      return;
    }
    // Browsers seed the Save-as-PDF filename from document.title, so swap it
    // for the print and put the real title back afterwards.
    const previousTitle = document.title;
    document.title = documentName;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <button
      onClick={handlePrint}
      className="print:hidden flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors"
    >
      <Printer size={16} />
      Print / Save as PDF
    </button>
  );
}
