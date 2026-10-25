/**
 * Icon keys the site can actually render, per surface.
 *
 * Icon fields in the admin are free text, and an unknown key silently falls back to a
 * placeholder icon, so a typo is invisible until you look at the live page. These lists
 * let the editors validate the field instead.
 *
 * Each registry is typed against its list (`Record<NavIconKey, …>`), so adding an icon to
 * a registry without adding it here — or vice versa — is a compile error rather than a
 * silent drift.
 */
export const NAV_ICON_KEYS = [
  "house",
  "user-round",
  "folder-code",
  "briefcase-business",
  "graduation-cap",
  "mail",
  "file-text",
  "file-user",
  "newspaper",
  "book-open-check",
  "quote",
  "wrench",
  "layout-dashboard",
  "building-2",
] as const;

export const SERVICE_ICON_KEYS = [
  "server",
  "layers",
  "plug",
  "gauge",
  "shield-check",
  "refresh-cw",
  "database",
] as const;

export const ADMIN_ICON_KEYS = [
  "award",
  "images",
  "briefcase-business",
  "book-open-check",
  "chart-no-axes-column-increasing",
  "circle-help",
  "folder-code",
  "graduation-cap",
  "languages",
  "layout-dashboard",
  "list-todo",
  "list-tree",
  "menu",
  "messages-square",
  "newspaper",
  "panels-top-left",
  "search",
  "search-check",
  "tags",
  "user-round",
  "users-round",
  "wrench",
  "quote",
] as const;

export type NavIconKey = (typeof NAV_ICON_KEYS)[number];
export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];
export type AdminIconKey = (typeof ADMIN_ICON_KEYS)[number];
