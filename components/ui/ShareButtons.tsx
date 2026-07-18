"use client";

import { useState } from "react";
import { Linkedin, Twitter, Link as LinkIcon, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions/older browsers) — fail silently.
    }
  }

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted mr-1">Share:</span>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
      >
        <Linkedin size={16} />
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
      >
        <Twitter size={16} />
      </a>
      <button
        onClick={() => void copyLink()}
        aria-label="Copy link"
        className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
      >
        {copied ? <Check size={16} className="text-accent" /> : <LinkIcon size={16} />}
      </button>
    </div>
  );
}
