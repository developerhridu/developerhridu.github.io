"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { MouseEvent, PointerEvent, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPublishedClients } from "@/lib/clients";
import type { Client } from "@/types";

const CLIENTS = getPublishedClients().filter((client): client is Client & { image: string } => !!client.image);

/** Seconds for one full lap at the resting speed (the ring turns counter-clockwise). */
const LAP_SECONDS = 40;
/** Rendered tile size (px). The base tile size is viewport-based, between MIN_BASE_SIZE
 *  and CHIP_SIZE; each tile is then scaled by where it sits on the ellipse. */
const CHIP_SIZE = 140;
const MIN_BASE_SIZE = 88;
/** Smallest a tile may shrink to, so its logo stays recognisable. */
const MIN_TILE_SIZE = 44;
/** Tile size at the two vertices (left/right ends of the long axis) and at the top/bottom
 *  (co-vertices), as multiples of the base size. Sizes blend gradually in between. */
const VERTEX_SCALE = 0.75;
const CO_VERTEX_SCALE = 0.4;
/** Shape of the blend: 1 = linear, higher = stays small longer and grows near the vertices. */
const SIZE_EASE = 1.5;
/** Semi-major axis (left/right reach) as a share of the hero width, and how far past the
 *  text it reaches at minimum (multiple of the snug fit). Always capped to fit the screen. */
const MAJOR_AXIS = 0.46;
const MAJOR_AXIS_MIN_FIT = 1.35;
/** Semi-minor axis (top/bottom reach) never drops below this share of the hero height. */
const MIN_MINOR_AXIS = 0.24;
/** Gap (px) kept between tiles and the hero text block. */
const CLEARANCE = 16;
/** Gap (px) kept between tiles and the hero edges. */
const EDGE_MARGIN = 40;
/** Pointer travel (px) after which a press on a tile counts as a spin, not a click. */
const DRAG_THRESHOLD = 6;
/** How quickly a flick slows back down to the resting speed (per second). */
const FLICK_DAMPING = 1.4;
/** How quickly the ring eases to a stop on hover, and back up to speed after (per second). */
const HOVER_EASE = 5;
/** Fastest a flick can spin the ring (laps per second). */
const MAX_FLICK_SPEED = 1.5;
/** Resting speed in laps per second. */
const REST_SPEED = 1 / LAP_SECONDS;

/** Hover preview card: width (px), gap from its tile (px), and how long it lingers after
 *  the pointer leaves (ms) so you can move from the tile onto the card. */
const PREVIEW_WIDTH = 240;
const PREVIEW_GAP = 14;
const PREVIEW_HIDE_DELAY = 140;

/** Samples per lap for the arc-length table. */
const ARC_SAMPLES = 360;

/**
 * Cumulative arc length of an ellipse (normalised to 0…1) at evenly spaced parameter
 * angles, so tiles can be spaced — and move — evenly along the path instead of bunching
 * up at the ends of the long axis.
 */
function buildArcTable(rx: number, ry: number): Float64Array {
  const table = new Float64Array(ARC_SAMPLES + 1);
  let total = 0;
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const t = ((i - 0.5) / ARC_SAMPLES) * Math.PI * 2;
    total += Math.hypot(rx * Math.sin(t), ry * Math.cos(t));
    table[i] = total;
  }
  for (let i = 1; i <= ARC_SAMPLES; i++) table[i] /= total;
  return table;
}

/** Parameter angle at a given fraction (0…1) of the way around the ellipse. */
function angleAtFraction(table: Float64Array, fraction: number): number {
  const u = fraction - Math.floor(fraction);
  let low = 0;
  let high = ARC_SAMPLES;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (table[mid] < u) low = mid;
    else high = mid;
  }
  const span = table[high] - table[low] || 1;
  return ((low + (u - table[low]) / span) / ARC_SAMPLES) * Math.PI * 2;
}

/** Fraction (0…1) of the way around the ellipse at a given parameter angle. */
function fractionAtAngle(table: Float64Array, angle: number): number {
  const turn = angle / (Math.PI * 2);
  const position = (turn - Math.floor(turn)) * ARC_SAMPLES;
  const index = Math.min(Math.floor(position), ARC_SAMPLES - 1);
  return table[index] + (table[index + 1] - table[index]) * (position - index);
}

/** Shortest signed step from one lap fraction to another, in (-0.5, 0.5]. */
function fractionStep(from: number, to: number): number {
  const step = to - from;
  return step - Math.round(step);
}

/**
 * Bounding box of what is actually visible in the hero text block: the text of headings
 * (not their full-width boxes) plus any other direct content such as the badge and stats.
 */
function measureContent(root: Element | null | undefined): DOMRect | null {
  if (!root) return null;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const add = (rect: DOMRect) => {
    if (!rect.width || !rect.height) return;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  };
  root.querySelectorAll("h1, h2, p, dl, a, [data-orbit-avoid-item]").forEach((el) => {
    if (el.closest("dl") && el.tagName !== "DL") return;
    if (/^(H1|H2|P)$/.test(el.tagName)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      add(range.getBoundingClientRect());
    } else {
      add(el.getBoundingClientRect());
    }
  });
  return Number.isFinite(left) ? new DOMRect(left, top, right - left, bottom - top) : root.getBoundingClientRect();
}

/** The fixed ellipse, relative to the orbit container. */
interface Orbit {
  centerX: number;
  centerY: number;
  rx: number;
  ry: number;
  vertexSize: number;
  coVertexSize: number;
  arcTable: Float64Array;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastFraction: number;
  lastTime: number;
  /** Smoothed drag speed in laps per second (positive = the ring's normal direction). */
  speed: number;
  moved: boolean;
}

/**
 * Client logos travelling around the hero text on one fixed ellipse, always in the same
 * direction. Tiles are biggest at the two vertices (left and right ends) and smallest at
 * the top and bottom, changing size gradually. Hovering a tile eases the ring to a stop.
 * Grab a tile and drag to turn the ring; a forward flick speeds it up, then it slows back
 * to its resting speed. A plain click (no drag) opens the client's page. Positions are
 * written straight to the DOM each frame to avoid re-rendering.
 */
export default function ClientOrbit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const orbitRef = useRef<Orbit | null>(null);
  /** How far the ring has travelled, in laps. Only ever increases outside a drag. */
  const progressRef = useRef(0);
  /** Current speed in laps per second; never negative. */
  const speedRef = useRef(REST_SPEED);
  const hoveredRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  /** Client whose preview card is open (hovered or keyboard-focused tile), if any. */
  const [preview, setPreview] = useState<number | null>(null);
  const previewRef = useRef<number | null>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  /** Each tile's current centre and rendered size, relative to the orbit container. */
  const tileBoxesRef = useRef<{ cx: number; cy: number; size: number }[]>([]);
  const [portalReady, setPortalReady] = useState(false);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || CLIENTS.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();

    // The ellipse is fixed: measured on mount, once the hero's entrance animation has
    // settled, and whenever the hero resizes — never per frame, so tiles stay on one path.
    const measure = () => {
      const bounds = container.getBoundingClientRect();
      const { width, height } = bounds;
      if (!width || !height) return;
      const baseSize = Math.max(MIN_BASE_SIZE, Math.min(CHIP_SIZE, width * 0.075, height * 0.16));
      const vertexSize = baseSize * VERTEX_SCALE;
      const coVertexSize = Math.max(MIN_TILE_SIZE, baseSize * CO_VERTEX_SCALE);
      // The ellipse goes around the hero text; find the text's box relative to the orbit.
      const avoid = measureContent(container.closest("section")?.querySelector("[data-orbit-avoid]"));
      const box = avoid && {
        x: avoid.left - bounds.left + avoid.width / 2,
        y: avoid.top - bounds.top + avoid.height / 2,
        halfW: avoid.width / 2 + CLEARANCE,
        halfH: avoid.height / 2 + CLEARANCE,
      };
      const centerX = box ? box.x : width / 2;
      const centerY = box ? box.y : height / 2;
      const maxRx = Math.min(centerX, width - centerX) - vertexSize / 2 - EDGE_MARGIN;
      const maxRy = Math.min(centerY, height - centerY) - coVertexSize / 2 - EDGE_MARGIN;
      // Corner of the text box (plus half the smallest tile) that the ellipse must pass outside.
      const cornerX = box ? box.halfW + MIN_TILE_SIZE / 2 : 0;
      const cornerY = box ? box.halfH + MIN_TILE_SIZE / 2 : 0;
      const rx = Math.min(maxRx, Math.max(width * MAJOR_AXIS, cornerX * Math.SQRT2 * MAJOR_AXIS_MIN_FIT));
      // Flattest ellipse with this width that still clears that corner: (x/rx)² + (y/ry)² = 1.
      const clearRy = rx > cornerX ? cornerY / Math.sqrt(1 - (cornerX / rx) ** 2) : cornerY * Math.SQRT2;
      const ry = Math.min(maxRy, Math.max(height * MIN_MINOR_AXIS, clearRy * 1.08));
      orbitRef.current = { centerX, centerY, rx, ry, vertexSize, coVertexSize, arcTable: buildArcTable(rx, ry) };
    };

    const place = () => {
      const orbit = orbitRef.current;
      if (!orbit) return;
      const { centerX, centerY, rx, ry, vertexSize, coVertexSize, arcTable } = orbit;
      chipRefs.current.forEach((chip, index) => {
        if (!chip) return;
        // Evenly spaced along the path; increasing progress moves every tile the same way.
        const angle = angleAtFraction(arcTable, index / CLIENTS.length - progressRef.current);
        const ringX = Math.cos(angle);
        // 1 at either vertex (left/right end), 0 at the top/bottom.
        const nearVertex = Math.pow(Math.abs(ringX), SIZE_EASE);
        const size = coVertexSize + (vertexSize - coVertexSize) * nearVertex;
        const x = centerX + rx * ringX - CHIP_SIZE / 2;
        const y = centerY + ry * Math.sin(angle) - CHIP_SIZE / 2;
        chip.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${size / CHIP_SIZE})`;
        chip.style.opacity = "1";
        chip.style.zIndex = String(Math.round(nearVertex * 100));
        tileBoxesRef.current[index] = { cx: x + CHIP_SIZE / 2, cy: y + CHIP_SIZE / 2, size };
      });
      positionPreview();
    };

    // Keeps the preview card beside its tile (the ring is still easing to a stop when it
    // opens). It sits on the tile's outer side when there's room, otherwise the inner side.
    const positionPreview = () => {
      const card = previewCardRef.current;
      const index = previewRef.current;
      const orbit = orbitRef.current;
      if (!card || index === null || !orbit) return;
      const tile = tileBoxesRef.current[index];
      if (!tile) return;
      const bounds = container.getBoundingClientRect();
      const tileX = bounds.left + tile.cx;
      const tileY = bounds.top + tile.cy;
      const height = card.offsetHeight;
      const outward = tile.cx < orbit.centerX ? -1 : 1;
      const outsideX = tileX + outward * (tile.size / 2 + PREVIEW_GAP) - (outward < 0 ? PREVIEW_WIDTH : 0);
      const fits = outsideX >= 8 && outsideX + PREVIEW_WIDTH <= window.innerWidth - 8;
      const left = fits ? outsideX : tileX - outward * (tile.size / 2 + PREVIEW_GAP) - (outward > 0 ? PREVIEW_WIDTH : 0);
      const top = Math.min(Math.max(tileY - height / 2, 8), window.innerHeight - height - 8);
      card.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    };

    measure();
    const settle = window.setTimeout(measure, 1200);
    const observer = new ResizeObserver(measure);
    observer.observe(container);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!dragRef.current) {
        const target = reduceMotion || hoveredRef.current ? 0 : REST_SPEED;
        const speed = speedRef.current;
        // A flick slows down gently; hovering (and un-hovering) eases in quickly.
        const rate = speed > REST_SPEED * 1.05 && !hoveredRef.current ? FLICK_DAMPING : HOVER_EASE;
        speedRef.current = Math.max(0, speed + (target - speed) * (1 - Math.exp(-rate * dt)));
        progressRef.current += speedRef.current * dt;
      }
      place();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // The preview card is portalled to <body> so it can sit above the hero text.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Portal target exists only after mount.
    setPortalReady(true);
    return () => window.clearTimeout(hideTimerRef.current);
  }, []);

  const openPreview = (index: number) => {
    window.clearTimeout(hideTimerRef.current);
    hoveredRef.current = true;
    if (dragRef.current?.moved) return;
    previewRef.current = index;
    setPreview(index);
  };

  const closePreview = () => {
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      hoveredRef.current = false;
      previewRef.current = null;
      setPreview(null);
    }, PREVIEW_HIDE_DELAY);
  };

  /** Where the pointer sits around the ellipse, as a lap fraction (0…1). */
  const pointerFraction = (clientX: number, clientY: number) => {
    const orbit = orbitRef.current;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!orbit || !bounds) return 0;
    const angle = Math.atan2((clientY - bounds.top - orbit.centerY) / orbit.ry, (clientX - bounds.left - orbit.centerX) / orbit.rx);
    return fractionAtAngle(orbit.arcTable, angle);
  };

  const onPointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastFraction: pointerFraction(event.clientX, event.clientY),
      lastTime: performance.now(),
      speed: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
    if (!drag.moved && previewRef.current !== null) {
      previewRef.current = null;
      setPreview(null);
    }
    drag.moved = true;
    const fraction = pointerFraction(event.clientX, event.clientY);
    const step = fractionStep(drag.lastFraction, fraction);
    const now = performance.now();
    const dt = Math.max((now - drag.lastTime) / 1000, 0.001);
    // The grabbed tile follows the pointer exactly along the ellipse.
    progressRef.current -= step;
    drag.speed = drag.speed * 0.6 + (-step / dt) * 0.4;
    drag.lastFraction = fraction;
    drag.lastTime = now;
  };

  const endDrag = (event: PointerEvent<HTMLAnchorElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    // Only a quick forward flick speeds the ring up; anything else (a slow drag, a pause
    // before letting go, or a backwards flick) carries on at the normal speed — the ring
    // never runs backwards on its own.
    const flicked = drag.moved && performance.now() - drag.lastTime < 120;
    speedRef.current = flicked ? Math.min(MAX_FLICK_SPEED, Math.max(REST_SPEED, drag.speed)) : REST_SPEED;
    dragRef.current = null;
    // Let the flick play out even though the pointer is still over the tile.
    if (flicked) hoveredRef.current = false;
  };

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
    }
  };

  if (CLIENTS.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" role="list" aria-label="Companies I've worked with">
      {CLIENTS.map((client, index) => (
        <Link
          key={client.id}
          ref={(el) => {
            chipRefs.current[index] = el;
          }}
          href={`/clients/${client.slug}`}
          role="listitem"
          aria-label={client.name}
          title={`${client.name} — drag to spin`}
          draggable={false}
          className="pointer-events-auto absolute left-0 top-0 rounded-xl bg-white border border-black/5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] p-3 transition-shadow origin-center will-change-transform cursor-grab active:cursor-grabbing touch-none select-none hover:ring-2 hover:ring-accent/60"
          style={{ width: CHIP_SIZE, height: CHIP_SIZE, opacity: 0 }}
          aria-describedby={preview === index ? "client-orbit-preview" : undefined}
          onPointerEnter={() => openPreview(index)}
          onPointerLeave={closePreview}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={onClick}
          onFocus={() => openPreview(index)}
          onBlur={closePreview}
        >
          <span className="relative block w-full h-full pointer-events-none">
            <Image src={client.image} alt="" fill sizes={`${CHIP_SIZE}px`} draggable={false} className="object-contain" />
          </span>
        </Link>
      ))}

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {preview !== null && CLIENTS[preview] && (
              <ClientPreview
                key={CLIENTS[preview].id}
                client={CLIENTS[preview]}
                cardRef={previewCardRef}
                onPointerEnter={() => openPreview(preview)}
                onPointerLeave={closePreview}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

/** Hover preview of a client: the same logo-and-name card as on /clients, plus a short blurb. */
function ClientPreview({
  client,
  cardRef,
  onPointerEnter,
  onPointerLeave,
}: {
  client: Client & { image: string };
  cardRef: RefObject<HTMLDivElement | null>;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <div
      ref={cardRef}
      id="client-orbit-preview"
      role="tooltip"
      className="fixed left-0 top-0 z-50 hidden lg:block"
      style={{ width: PREVIEW_WIDTH }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.16 }}
      >
        <Link
          href={`/clients/${client.slug}`}
          className="group block rounded-2xl border border-border bg-surface/95 backdrop-blur-md p-3 shadow-xl"
        >
          <div className="relative h-24 w-full rounded-lg bg-white/90 mb-3">
            <Image src={client.image} alt="" fill sizes={`${PREVIEW_WIDTH}px`} className="object-contain p-4" />
          </div>
          <p className="text-base font-semibold text-foreground text-center group-hover:text-accent transition-colors">
            {client.name}
          </p>
          {client.description && (
            <p className="mt-1 text-xs text-muted text-center line-clamp-2">{client.description}</p>
          )}
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-accent">
            View client <ArrowRight size={12} aria-hidden="true" />
          </p>
        </Link>
      </motion.div>
    </div>
  );
}
