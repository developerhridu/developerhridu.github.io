import type { ArrayConfig } from "@/components/admin/GenericArrayEditor";

export const experienceConfig: ArrayConfig = {
  path: "content/experience.json",
  arrayKey: "experiences",
  label: "Experience",
  titleField: "company",
  subtitleField: "role",
  imageFolder: "experience",
  fields: [
    { key: "company", label: "Company", type: "text" },
    { key: "role", label: "Role", type: "text" },
    { key: "period", label: "Period", type: "text", placeholder: "April 2024 - Present" },
    { key: "location", label: "Location", type: "text" },
    { key: "logo", label: "Logo", type: "image" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "highlights", label: "Highlights (one per line)", type: "list" },
    { key: "technologies", label: "Technologies (comma separated)", type: "tags" },
  ],
};

export const certificationsConfig: ArrayConfig = {
  path: "content/certifications.json",
  arrayKey: "certifications",
  label: "Certifications",
  titleField: "name",
  subtitleField: "issuer",
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "issuer", label: "Issuer", type: "text" },
    { key: "date", label: "Date", type: "text", placeholder: "June 2024" },
    { key: "verifyUrl", label: "Verify URL", type: "url" },
    { key: "icons", label: "Icon(s) (comma separated paths)", type: "tags" },
  ],
  extraNormalizeIn: (raw) => ({
    icons: (raw.icon ? [raw.icon as string] : ((raw.icons as string[]) ?? [])).join(", "),
  }),
  extraTransformOut: (out) => {
    const iconsArr = (out.icons as string[]) ?? [];
    delete out.icons;
    if (iconsArr.length === 1) out.icon = iconsArr[0];
    else if (iconsArr.length > 1) out.icons = iconsArr;
    return out;
  },
};

export const projectsConfig: ArrayConfig = {
  path: "content/projects.json",
  arrayKey: "projects",
  label: "Projects",
  titleField: "title",
  imageFolder: "projects",
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "longDescription", label: "Long Description", type: "textarea" },
    { key: "image", label: "Image", type: "image" },
    { key: "tags", label: "Tags (comma separated)", type: "tags" },
    { key: "liveUrl", label: "Live URL", type: "url" },
    { key: "githubUrl", label: "GitHub URL (single repo)", type: "url" },
    { key: "githubUrlFrontend", label: "GitHub Frontend URL", type: "url" },
    { key: "githubUrlBackend", label: "GitHub Backend URL", type: "url" },
    { key: "featured", label: "Featured", type: "boolean" },
  ],
  extraNormalizeIn: (raw) => {
    const g = raw.githubUrl;
    if (g && typeof g === "object") {
      const obj = g as { frontend?: string; backend?: string };
      return { githubUrl: "", githubUrlFrontend: obj.frontend ?? "", githubUrlBackend: obj.backend ?? "" };
    }
    return { githubUrl: (g as string) ?? "", githubUrlFrontend: "", githubUrlBackend: "" };
  },
  extraTransformOut: (out, form) => {
    const single = String(form.githubUrl ?? "").trim();
    const fe = String(form.githubUrlFrontend ?? "").trim();
    const be = String(form.githubUrlBackend ?? "").trim();
    delete out.githubUrlFrontend;
    delete out.githubUrlBackend;
    if (fe || be) {
      out.githubUrl = { ...(fe ? { frontend: fe } : {}), ...(be ? { backend: be } : {}) };
    } else if (single) {
      out.githubUrl = single;
    } else {
      out.githubUrl = null;
    }
    return out;
  },
};

export const menuConfig: ArrayConfig = {
  path: "content/menu.json",
  arrayKey: "navLinks",
  label: "Menu",
  titleField: "name",
  subtitleField: "href",
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "href", label: "Href", type: "text" },
    { key: "icon", label: "Icon key", type: "text", placeholder: "home, user, folder-kanban…" },
    { key: "external", label: "External link", type: "boolean" },
    { key: "visible", label: "Visible in menu", type: "boolean", defaultBoolean: true },
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
    { key: "level", label: "Level (0-100)", type: "number", min: 0, max: 100 },
  ],
};
