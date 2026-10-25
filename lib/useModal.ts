"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface UseModalOptions {
  open: boolean;
  onClose: () => void;
  /** False when the component focuses its own element (a search input, say). */
  autoFocus?: boolean;
  /** False for an overlay that should not lock page scroll. */
  lockScroll?: boolean;
  /** Return false to ignore Escape — used when a nested overlay should close first. */
  allowEscape?: () => boolean;
}

/**
 * Shared behaviour every overlay on the site needs: Escape closes it, focus moves into it
 * and cannot Tab out, focus returns to whatever opened it, and the page behind stops
 * scrolling. Each modal used to implement some subset of this — two restored no focus at
 * all, and none trapped Tab, so keyboard users fell through into the page behind.
 *
 * Attach the returned ref to the dialog's own container (not the backdrop), and give that
 * element `role="dialog"`, `aria-modal="true"` and a label.
 */
export function useModal<T extends HTMLElement>({
  open,
  onClose,
  autoFocus = true,
  lockScroll = true,
  allowEscape,
}: UseModalOptions) {
  const containerRef = useRef<T>(null);
  /** Kept in refs so the key handler isn't re-subscribed on every render. */
  const onCloseRef = useRef(onClose);
  const allowEscapeRef = useRef(allowEscape);

  useEffect(() => {
    onCloseRef.current = onClose;
    allowEscapeRef.current = allowEscape;
  }, [onClose, allowEscape]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Captured for the cleanup: by then the ref may already be cleared.
    const container = containerRef.current;

    // The container may mount a frame later under AnimatePresence.
    const focusFrame = requestAnimationFrame(() => {
      if (!autoFocus) return;
      const container = containerRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (allowEscapeRef.current && !allowEscapeRef.current()) return;
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusable.length === 0) {
        // Nothing to move to — keep focus on the dialog rather than letting it escape.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!container.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      // Return focus to the trigger, but not if something else has claimed it since.
      if (previouslyFocused?.isConnected && document.activeElement !== previouslyFocused) {
        const active = document.activeElement;
        const insideModal = container?.contains(active ?? null);
        if (!active || active === document.body || insideModal) {
          previouslyFocused.focus();
        }
      }
    };
  }, [open, autoFocus, lockScroll]);

  return containerRef;
}
