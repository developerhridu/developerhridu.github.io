import type { ArrayConfig } from "@/components/admin/GenericArrayEditor";
import { ADMIN_ICON_KEYS, NAV_ICON_KEYS, SERVICE_ICON_KEYS } from "@/lib/iconKeys";

export const educationConfig: ArrayConfig = {
  path: "content/education.json",
  arrayKey: "education",
  label: "Education",
  titleField: "degree",
  subtitleField: "institution",
  imageFolder: "education",
  sitePath: "/certifications",
  fields: [
    { key: "degree", label: "Degree", type: "text" },
    { key: "institution", label: "Institution", type: "text", required: true },
    { key: "period", label: "Period", type: "text", placeholder: "January 2017 - January 2023" },
    { key: "location", label: "Location", type: "text" },
    { key: "cgpa", label: "CGPA / Grade (optional)", type: "text" },
    { key: "icon", label: "Icon / Logo", type: "image", uploadFolder: "logos", nameFrom: "institution" },
    { key: "achievements", label: "Achievements (one per line, optional)", type: "list" },
  ],
};

export const certificationsConfig: ArrayConfig = {
  path: "content/certifications.json",
  arrayKey: "certifications",
  label: "Certifications",
  titleField: "name",
  subtitleField: "issuer",
  imageFolder: "certifications",
  sitePath: "/certifications",
  preview: "certification",
  fields: [
    { key: "name", label: "Certificate name", type: "text", placeholder: "Certified SQL (Advanced)", section: "Details", width: "full" },
    { key: "issuer", label: "Issued by", type: "text", placeholder: "HackerRank", section: "Details", required: true },
    { key: "date", label: "Issue date", type: "text", placeholder: "June 2024", section: "Details", hint: "Shown as written, e.g. \"June 2024\"." },
    { key: "verifyUrl", label: "Verification link", type: "url", placeholder: "https://…", section: "Details", width: "full", hint: "Clicking the card opens this link in a new tab." },
    { key: "published", label: "Published (visible on the site)", type: "boolean", defaultBoolean: true, section: "Details" },
    { key: "photos", label: "Certificate photos", type: "images", placeholder: "/images/certifications/example.png", section: "Certificate photos" },
    { key: "icons", label: "Issuer logo(s)", type: "images", placeholder: "/images/logos/example.svg", section: "Issuer logo", uploadFolder: "logos", nameFrom: "issuer" },
  ],
  extraNormalizeIn: (raw) => ({
    icons: (raw.icon ? [raw.icon as string] : ((raw.icons as string[]) ?? [])).join("\n"),
  }),
  extraTransformOut: (out) => {
    const iconsArr = (out.icons as string[]) ?? [];
    delete out.icons;
    if (iconsArr.length === 1) out.icon = iconsArr[0];
    else if (iconsArr.length > 1) out.icons = iconsArr;
    return out;
  },
};

export const menuConfig: ArrayConfig = {
  path: "content/menu.json",
  arrayKey: "navLinks",
  label: "Menu",
  titleField: "name",
  subtitleField: "href",
  sitePath: (entry) => (typeof entry.href === "string" && entry.href.startsWith("/") ? entry.href : null),
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "href", label: "Link", type: "url", placeholder: "/about", unique: true, hint: "A site path like /about, or a full URL for external links." },
    { key: "icon", label: "Icon key", type: "text", placeholder: NAV_ICON_KEYS.slice(0, 4).join(", "), iconKeys: NAV_ICON_KEYS, hint: `One of: ${NAV_ICON_KEYS.join(", ")}` },
    { key: "external", label: "External link", type: "boolean" },
    { key: "published", label: "Published (visible in menu & search)", type: "boolean", defaultBoolean: true },
  ],
};

export const servicesConfig: ArrayConfig = {
  path: "content/services.json",
  arrayKey: "services",
  label: "Services",
  titleField: "title",
  subtitleField: "icon",
  sitePath: "/services",
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea", required: true },
    {
      key: "icon",
      label: "Icon key",
      type: "text",
      placeholder: SERVICE_ICON_KEYS.slice(0, 4).join(", "),
      iconKeys: SERVICE_ICON_KEYS,
      hint: `One of: ${SERVICE_ICON_KEYS.join(", ")}`,
    },
    { key: "highlights", label: "Highlights (one per line, optional)", type: "list" },
    { key: "published", label: "Published (visible on the site)", type: "boolean", defaultBoolean: true },
  ],
};

export const adminMenuConfig: ArrayConfig = {
  path: "content/admin-menu.json",
  arrayKey: "tabs",
  label: "Admin Menu",
  titleField: "label",
  subtitleField: "id",
  fields: [
    { key: "label", label: "Label", type: "text", required: true },
    { key: "icon", label: "Icon key", type: "text", placeholder: ADMIN_ICON_KEYS.slice(0, 4).join(", "), iconKeys: ADMIN_ICON_KEYS, hint: `One of: ${ADMIN_ICON_KEYS.join(", ")}` },
    { key: "published", label: "Published", type: "boolean", defaultBoolean: true },
  ],
};

export const sectionsConfig: ArrayConfig = {
  path: "content/sections.json",
  arrayKey: "sections",
  label: "Section Copy",
  titleField: "title",
  subtitleField: "id",
  fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "subtitle", label: "Subtitle", type: "textarea" },
  ],
};

export const skillCategoriesConfig: ArrayConfig = {
  path: "content/skill-categories.json",
  arrayKey: "categories",
  label: "Skill Categories",
  titleField: "label",
  subtitleField: "key",
  fields: [
    { key: "key", label: "Tech-Stack Key (must match tech-stack.json)", type: "text", required: true, unique: true },
    { key: "label", label: "Display Label", type: "text" },
    { key: "color", label: "Tailwind Color Class", type: "text", placeholder: "bg-accent, bg-pink-500…" },
  ],
};

export const seoConfig: ArrayConfig = {
  path: "content/seo.json",
  arrayKey: "routes",
  label: "SEO / Metadata",
  titleField: "title",
  subtitleField: "route",
  sitePath: (entry) => (typeof entry.route === "string" ? entry.route : null),
  fields: [
    { key: "route", label: "Route", type: "text", placeholder: "/about", required: true, unique: true },
    { key: "title", label: "Title", type: "text", counter: { min: 30, max: 60 } },
    { key: "description", label: "Description", type: "textarea", required: true, counter: { min: 120, max: 160 } },
    { key: "ogTitle", label: "OG Title (optional)", type: "text", counter: { max: 60 } },
    { key: "ogDescription", label: "OG Description (optional)", type: "textarea", counter: { max: 200 } },
    { key: "twitterTitle", label: "Twitter Title (optional)", type: "text", counter: { max: 70 } },
    { key: "twitterDescription", label: "Twitter Description (optional)", type: "textarea", counter: { max: 200 } },
    { key: "keywords", label: "Keywords (comma separated, optional)", type: "tags" },
    { key: "noIndex", label: "Hide from search engines (noindex)", type: "boolean" },
  ],
};

export const proficiencyConfig: ArrayConfig = {
  path: "content/proficiency.json",
  arrayKey: "proficiency",
  label: "Skill Proficiency",
  titleField: "name",
  subtitleField: "level",
  subtitleFormat: (value) => `${value}%`,
  fields: [
    { key: "name", label: "Skill Name", type: "text" },
    { key: "level", label: "Level (0-100)", type: "number", min: 0, max: 100, required: true },
  ],
};
