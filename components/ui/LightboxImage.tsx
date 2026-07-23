"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import ContentImage from "@/components/ui/ContentImage";

interface LightboxImageProps {
  src?: string;
  alt: string;
  wrapperClassName?: string;
  imgClassName?: string;
  initials?: string;
  initialsClassName?: string;
}

export default function LightboxImage({
  src,
  alt,
  wrapperClassName,
  imgClassName,
  initials,
  initialsClassName,
}: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!src) {
    return (
      <ContentImage
        alt={alt}
        wrapperClassName={wrapperClassName}
        imgClassName={imgClassName}
        initials={initials}
        initialsClassName={initialsClassName}
        natural
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View full image: ${alt}`}
        className={`group relative block w-full p-0 border-0 bg-transparent text-left cursor-zoom-in ${
          wrapperClassName ?? ""
        }`.trim()}
      >
        <ContentImage
          src={src}
          alt={alt}
          imgClassName={imgClassName}
          initials={initials}
          initialsClassName={initialsClassName}
          natural
        />
        <span className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={16} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-surface/80 hover:bg-surface text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <motion.img
              src={src}
              alt={alt}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
