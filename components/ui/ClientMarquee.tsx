"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getPublishedClients } from "@/lib/clients";
import type { Client } from "@/types";
import { primaryCoverImage } from "@/lib/coverImages";
import ClientPreviewCard, { CLIENT_PREVIEW_WIDTH } from "@/components/ui/ClientPreviewCard";

type ClientWithLogo = Client & { image: string };

const CLIENTS_WITH_LOGOS: ClientWithLogo[] = getPublishedClients()
  .map((client) => ({ ...client, image: primaryCoverImage(client) }))
  .filter((client): client is ClientWithLogo => !!client.image);

const CHIP_CLASS =
  "flex items-center justify-center w-36 h-24 shrink-0 rounded-xl bg-white/90 px-5 py-3 transition-transform hover:scale-105";

/** Resting drift in px/sec — matches the old 28s CSS loop. */
const REST_SPEED = 40;
/** Pointer travel (px) after which a press counts as a spin, not a click. */
const DRAG_THRESHOLD = 6;
/** How quickly a flick slows back to the resting speed (per second). */
const FLICK_DAMPING = 1.4;
/** How quickly the band eases to a stop and back up to speed (per second). */
const EASE = 5;
/** Upper bound on flick speed (px/sec), so a hard swipe stays readable. */
const MAX_SPEED = 2600;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  moved: boolean;
  velocity: number;
}

function LogoTrack({
  ariaHidden,
  activeSlug,
  onOpen,
  onNavigate,
  suppressClick,
}: {
  ariaHidden: boolean;
  activeSlug: string | null;
  onOpen: (client: ClientWithLogo) => void;
  onNavigate: () => void;
  suppressClick: () => boolean;
}) {
  return (
    <div className="flex items-center gap-12 pr-12 shrink-0" aria-hidden={ariaHidden || undefined}>
      {CLIENTS_WITH_LOGOS.map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.slug}`}
          aria-label={client.name}
          tabIndex={ariaHidden ? -1 : undefined}
          draggable={false}
          className={CHIP_CLASS}
          // Mouse opens the preview on hover, so the click that follows navigates. Touch has
          // no hover, so the first tap opens the preview and the next one navigates.
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") onOpen(client);
          }}
          onFocus={() => onOpen(client)}
          onClick={(event) => {
            if (suppressClick()) {
              event.preventDefault();
              return;
            }
            if (activeSlug === client.slug) {
              onNavigate();
              return;
            }
            event.preventDefault();
            onOpen(client);
          }}
        >
          <span className="relative block w-full h-full pointer-events-none">
            <Image src={client.image} alt="" fill sizes="144px" className="object-contain" draggable={false} />
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Horizontal client band used below `lg`, where the hero shows the orbit instead. It
 * behaves like the orbit: it drifts on its own, can be dragged or flicked to spin, pauses
 * while a preview is open, and shows the same preview card (logo, name, blurb, link).
 */
export default function ClientMarquee() {
  const [active, setActive] = useState<ClientWithLogo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /** Pixels scrolled, wrapped to one track's width so the loop is seamless. */
  const offsetRef = useRef(0);
  const speedRef = useRef(REST_SPEED);
  const dragRef = useRef<DragState | null>(null);
  /** True right after a drag, so the click it ends with doesn't open a client. */
  const suppressClickRef = useRef(false);
  /** Pointer resting over the band (mouse), which pauses the drift like hover used to. */
  const hoverRef = useRef(false);
  /** Mirrors `active` for the animation loop, which must not re-subscribe on every change. */
  const activeRef = useRef<ClientWithLogo | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Drive the drift with rAF instead of a CSS animation, so dragging can move it too.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!dragRef.current) {
        const paused = hoverRef.current || activeRef.current !== null;
        const target = reduceMotion || paused ? 0 : REST_SPEED;
        const speed = speedRef.current;
        // A flick coasts down gently; stopping and restarting eases quickly.
        const rate = speed > REST_SPEED * 1.05 && !paused ? FLICK_DAMPING : EASE;
        speedRef.current = speed + (target - speed) * Math.min(1, dt * rate);
        offsetRef.current += speedRef.current * dt;
      }

      const track = trackRef.current;
      if (track) {
        const half = track.scrollWidth / 2;
        if (half > 0) offsetRef.current = ((offsetRef.current % half) + half) % half;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    function onPointerDownOutside(event: globalThis.PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setActive(null);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDownOutside);
    };
  }, [active]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      moved: false,
      velocity: 0,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved) {
      // Only start spinning once the pointer clearly moves sideways, so a tap still opens
      // a client and a vertical swipe still scrolls the page.
      const dx = Math.abs(event.clientX - drag.startX);
      const dy = Math.abs(event.clientY - drag.startY);
      if (dx < DRAG_THRESHOLD || dx <= dy) return;
      drag.moved = true;
      setActive(null);
    }

    const now = performance.now();
    const dx = event.clientX - drag.lastX;
    const dt = Math.max((now - drag.lastTime) / 1000, 0.001);
    offsetRef.current -= dx;
    drag.velocity = -dx / dt;
    drag.lastX = event.clientX;
    drag.lastTime = now;
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;

    if (drag.moved) {
      suppressClickRef.current = true;
      // Let the click that ends this drag through the handler, then re-enable clicks.
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      // A flick forward coasts; dragging backwards just resumes the normal drift.
      const flick = Math.min(Math.abs(drag.velocity), MAX_SPEED);
      if (drag.velocity > 0 && flick > REST_SPEED) speedRef.current = flick;
    }
  }

  if (CLIENTS_WITH_LOGOS.length === 0) return null;

  return (
    <div className="mt-4" ref={containerRef}>
      <p className="text-center text-xs uppercase tracking-widest text-muted mb-4">
        Companies I&apos;ve worked with
      </p>

      <div className="relative">
        <div
          className="relative overflow-hidden marquee-fade cursor-grab active:cursor-grabbing touch-pan-y select-none"
          role="list"
          aria-label="Companies I've worked with"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") hoverRef.current = true;
          }}
          onPointerLeave={() => {
            hoverRef.current = false;
          }}
        >
          <div ref={trackRef} className="flex w-max will-change-transform">
            <LogoTrack
              ariaHidden={false}
              activeSlug={active?.slug ?? null}
              onOpen={setActive}
              onNavigate={() => setActive(null)}
              suppressClick={() => suppressClickRef.current}
            />
            <LogoTrack
              ariaHidden
              activeSlug={active?.slug ?? null}
              onOpen={setActive}
              onNavigate={() => setActive(null)}
              suppressClick={() => suppressClickRef.current}
            />
          </div>
        </div>

        {/* Sits above the band (outside the fade mask) so it isn't clipped and doesn't shift the page. */}
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.id}
              role="tooltip"
              className="absolute bottom-full left-1/2 z-30 mb-3 -translate-x-1/2"
              style={{ width: CLIENT_PREVIEW_WIDTH }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.16 }}
            >
              <ClientPreviewCard client={active} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
