"use client";

import { useEffect, useMemo, useState } from "react";
import IconButton from "@/components/ui/IconButton";
import { type FileChange } from "@/lib/github";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { slugify, fileToBase64, confirmDeleteMessage } from "@/components/admin/shared";
import ImageListInput, { SingleImageInput } from "@/components/admin/ImageListInput";
import RelatedMultiSelect from "@/components/admin/RelatedMultiSelect";
import EntryList from "@/components/admin/EntryList";
import { useContentCrud } from "@/components/admin/useContentCrud";
import { ErrorBanner, SuccessBanner } from "@/components/admin/CrudBanners";
import { CheckboxField, EditorPanel, Field, FormActions, FormSection, fieldClass } from "@/components/admin/FormKit";
import { confirmDiscardEdits, snapshot, useSaveShortcut, useUnsavedGuard } from "@/components/admin/useUnsavedGuard";
import { collectErrors, errorSummary, focusFirstError, requiredError, urlError, type FieldErrors } from "@/components/admin/validation";
import { renderPreview } from "@/components/admin/previews";
import { employerSlug } from "@/lib/employers";
import type { RelatedRefs } from "@/types";

interface Project {
  name: string;
  description?: string;
  technologies: string[];
  highlights: string[];
}

interface Entry {
  id: string;
  published?: boolean;
  company: string;
  companyUrl?: string;
  logo?: string;
  role: string;
  period: string;
  location?: string;
  verifyUrl?: string;
  summary?: string;
  photos?: string[];
  related?: RelatedRefs;
  projects: Project[];
}

/** Every uploaded image an entry points at (logo + gallery). */
function entryImages(entry: Entry): string[] {
  return [entry.logo, ...(entry.photos ?? [])].filter((p): p is string => !!p);
}

const PATH = "content/experience.json";
const ARRAY_KEY = "experiences";
const IMAGE_FOLDER = "experience";

function isManagedImage(imagePath: string | undefined): imagePath is string {
  return !!imagePath && imagePath.startsWith(`/images/${IMAGE_FOLDER}/`);
}

function toRepoPath(publicPath: string): string {
  return `public${publicPath}`;
}

function blankEntry(): Entry {
  return {
    id: "",
    published: false,
    company: "",
    companyUrl: "",
    logo: "",
    role: "",
    period: "",
    location: "",
    verifyUrl: "",
    summary: "",
    photos: [],
    projects: [],
  };
}

function blankProject(): Project {
  return { name: "", description: "", technologies: [], highlights: [] };
}

function makeId(base: string, existingIds: string[]): string {
  const baseSlug = slugify(base) || "item";
  let candidate = baseSlug;
  let n = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${baseSlug}-${n}`;
    n++;
  }
  return candidate;
}

function normalizeLoaded(list: Entry[]): Entry[] {
  return list.map((e) => ({ ...e, projects: e.projects ?? [] }));
}

interface FormState {
  entry: Entry;
  techText: string[];
  highlightsText: string[];
}

function toFormState(entry: Entry): FormState {
  const projects = entry.projects ?? [];
  return {
    entry: { ...entry, projects },
    techText: projects.map((p) => p.technologies.join(", ")),
    highlightsText: projects.map((p) => p.highlights.join("\n")),
  };
}

function validate({ entry }: FormState): FieldErrors {
  return collectErrors([
    ["company", requiredError(entry.company, "Company")],
    ["role", requiredError(entry.role, "Role")],
    ["period", requiredError(entry.period, "Period")],
    ["companyUrl", urlError(entry.companyUrl, { allowRelative: false })],
    ["verifyUrl", urlError(entry.verifyUrl)],
    ["logo", urlError(entry.logo)],
    ...entry.projects.map((p, i): [string, string | null] => [`project-${i}`, requiredError(p.name, "Project name")]),
  ]);
}

export default function ExperienceManager({
  token,
  onAuthError,
  initialNew = false,
}: {
  token: string;
  onAuthError: () => void;
  initialNew?: boolean;
}) {
  const crud = useContentCrud<Entry>({ path: PATH, arrayKey: ARRAY_KEY, label: "experience", token, onAuthError, normalizeLoaded });
  const { entries, saving, setSaving, setError, commit, reportError, clearMessages } = crud;

  const [form, setForm] = useState<FormState | null>(() => (initialNew ? toFormState(blankEntry()) : null));
  const [opened, setOpened] = useState(() => (initialNew ? snapshot(toFormState(blankEntry())) : ""));
  const [isNew, setIsNew] = useState(initialNew);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dirty = !!form && (snapshot(form) !== opened || !!logoFile || photoFiles.length > 0);
  useUnsavedGuard(dirty);

  const previewFiles = useMemo(() => [...(logoFile ? [logoFile] : []), ...photoFiles], [logoFile, photoFiles]);
  const previewUrls = useMemo(() => new Map(previewFiles.map((file) => [file, URL.createObjectURL(file)])), [previewFiles]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  function open(next: FormState, asNew: boolean, startDirty = false) {
    setForm(next);
    setOpened(startDirty ? "" : snapshot(next));
    setIsNew(asNew);
    setLogoFile(null);
    setPhotoFiles([]);
    setFieldErrors({});
    clearMessages();
  }

  function startNew() {
    if (!confirmDiscardEdits(dirty)) return;
    open(toFormState(blankEntry()), true);
  }

  function startEdit(entry: Entry) {
    if (!confirmDiscardEdits(dirty)) return;
    open(toFormState(entry), false);
  }

  function duplicate(entry: Entry) {
    if (!confirmDiscardEdits(dirty)) return;
    open(toFormState({ ...entry, id: "", company: `${entry.company} (copy)`, published: false }), true, true);
  }

  function cancelEdit() {
    if (!confirmDiscardEdits(dirty)) return;
    setForm(null);
    setLogoFile(null);
    setPhotoFiles([]);
    setFieldErrors({});
  }

  function setEntry(patch: Partial<Entry>) {
    setForm((previous) => (previous ? { ...previous, entry: { ...previous.entry, ...patch } } : previous));
    const keys = Object.keys(patch);
    if (keys.some((key) => fieldErrors[key])) {
      setFieldErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !keys.includes(key))));
    }
  }

  function updateProject(index: number, patch: Partial<Project>) {
    setForm((previous) =>
      previous
        ? { ...previous, entry: { ...previous.entry, projects: previous.entry.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)) } }
        : previous
    );
  }

  function addProject() {
    setForm((previous) =>
      previous
        ? {
            entry: { ...previous.entry, projects: [...previous.entry.projects, blankProject()] },
            techText: [...previous.techText, ""],
            highlightsText: [...previous.highlightsText, ""],
          }
        : previous
    );
  }

  function removeProject(index: number) {
    setForm((previous) =>
      previous
        ? {
            entry: { ...previous.entry, projects: previous.entry.projects.filter((_, i) => i !== index) },
            techText: previous.techText.filter((_, i) => i !== index),
            highlightsText: previous.highlightsText.filter((_, i) => i !== index),
          }
        : previous
    );
  }

  function moveProject(index: number, direction: -1 | 1) {
    setForm((previous) => {
      if (!previous) return previous;
      const target = index + direction;
      if (target < 0 || target >= previous.entry.projects.length) return previous;
      const swap = <T,>(list: T[]) => {
        const next = [...list];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      };
      return {
        entry: { ...previous.entry, projects: swap(previous.entry.projects) },
        techText: swap(previous.techText),
        highlightsText: swap(previous.highlightsText),
      };
    });
  }

  async function handleSave() {
    if (!form || saving) return;
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errorSummary(errors));
      focusFirstError();
      return;
    }
    setFieldErrors({});
    const { entry: editing, techText, highlightsText } = form;

    const current = entries ?? [];
    const previous = !isNew ? current.find((e) => e.id === editing.id) : undefined;
    const oldImages = previous ? entryImages(previous) : [];

    setSaving(true);
    setError(null);

    const changes: FileChange[] = [];
    let logo = editing.logo;
    const photos = [...(editing.photos ?? [])];
    try {
      const slug = slugify(editing.company);
      if (logoFile) {
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        logo = `/images/${IMAGE_FOLDER}/${slug}.${ext}`;
        changes.push({ path: toRepoPath(logo), content: await fileToBase64(logoFile) });
      }
      for (const file of photoFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const publicPath = `/images/${IMAGE_FOLDER}/${slug}-photo-${crypto.randomUUID()}.${ext}`;
        changes.push({ path: toRepoPath(publicPath), content: await fileToBase64(file) });
        photos.push(publicPath);
      }
    } catch (err) {
      reportError(err);
      setSaving(false);
      return;
    }

    const projects: Project[] = editing.projects.map((p, i) => ({
      name: p.name.trim(),
      description: p.description?.trim() || undefined,
      technologies: (techText[i] ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      highlights: (highlightsText[i] ?? "").split("\n").map((h) => h.trim()).filter(Boolean),
    }));

    const related = editing.related ?? {};
    const hasRelated = Object.values(related).some((refs) => (refs ?? []).length > 0);
    const finalEntry: Entry = {
      ...editing,
      logo,
      summary: editing.summary?.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
      related: hasRelated ? related : undefined,
      projects,
    };

    const updated = isNew
      ? [...current, { ...finalEntry, id: makeId(editing.company, current.map((e) => e.id)) }]
      : current.map((e) => (e.id === editing.id ? finalEntry : e));

    const stillUsed = new Set(updated.flatMap(entryImages));
    for (const oldImage of oldImages) {
      if (isManagedImage(oldImage) && !stillUsed.has(oldImage)) {
        changes.push({ path: toRepoPath(oldImage), content: null });
      }
    }

    const message = isNew ? `content: add ${editing.company}` : `content: update ${editing.company}`;
    if (await commit(changes, updated, message)) {
      setForm(null);
      setLogoFile(null);
      setPhotoFiles([]);
    }
  }

  useSaveShortcut(() => void handleSave(), !!form && !saving);

  async function handleDelete(entry: Entry) {
    if (!confirm(confirmDeleteMessage(entry.company))) return;
    const updated = (entries ?? []).filter((e) => e.id !== entry.id);
    const stillUsed = new Set(updated.flatMap(entryImages));
    const changes: FileChange[] = entryImages(entry)
      .filter((image) => isManagedImage(image) && !stillUsed.has(image))
      .map((image) => ({ path: toRepoPath(image), content: null }));
    await commit(changes, updated, `content: delete ${entry.company}`);
  }

  const previewEntry = form
    ? {
        ...form.entry,
        logo: logoFile ? previewUrls.get(logoFile) : form.entry.logo,
        photos: [...(form.entry.photos ?? []), ...photoFiles.map((file) => previewUrls.get(file) ?? "")],
      }
    : null;

  return (
    <div>
      <ErrorBanner message={crud.error} onReload={() => void crud.reload()} />
      <SuccessBanner message={crud.successMsg} />

      {form ? (
        <EditorPanel
          title={isNew ? "New experience" : `Edit: ${form.entry.company || "experience"}`}
          dirty={dirty}
          onClose={cancelEdit}
          preview={previewEntry ? renderPreview("employer", previewEntry) : undefined}
        >
          <FormSection title="Job">
            <Field label="Company" htmlFor="exp-company" required error={fieldErrors.company}>
              <input id="exp-company" value={form.entry.company} onChange={(e) => setEntry({ company: e.target.value })} className={fieldClass(fieldErrors.company)} />
            </Field>
            <Field label="Role" htmlFor="exp-role" required error={fieldErrors.role}>
              <input id="exp-role" value={form.entry.role} onChange={(e) => setEntry({ role: e.target.value })} className={fieldClass(fieldErrors.role)} />
            </Field>
            <Field label="Period" htmlFor="exp-period" required error={fieldErrors.period}>
              <input id="exp-period" value={form.entry.period} onChange={(e) => setEntry({ period: e.target.value })} placeholder="April 2024 - Present" className={fieldClass(fieldErrors.period)} />
            </Field>
            <Field label="Location" htmlFor="exp-location">
              <input id="exp-location" value={form.entry.location ?? ""} onChange={(e) => setEntry({ location: e.target.value })} placeholder="Dhaka, Bangladesh" className={fieldClass()} />
            </Field>
            <Field label="Company website" htmlFor="exp-url" error={fieldErrors.companyUrl}>
              <input id="exp-url" type="url" value={form.entry.companyUrl ?? ""} onChange={(e) => setEntry({ companyUrl: e.target.value })} placeholder="https://example.com" className={fieldClass(fieldErrors.companyUrl)} />
            </Field>
            <Field label="Verify URL (proof of employment)" htmlFor="exp-verify" error={fieldErrors.verifyUrl}>
              <input id="exp-verify" value={form.entry.verifyUrl ?? ""} onChange={(e) => setEntry({ verifyUrl: e.target.value })} placeholder="https://… or /pdf/letter.pdf" className={fieldClass(fieldErrors.verifyUrl)} />
            </Field>
            <CheckboxField
              checked={form.entry.published !== false}
              onChange={(published) => setEntry({ published })}
              label="Published"
              hint="visible on the site, resume and /employers"
            />
            <Field label="Logo" htmlFor="exp-logo" full error={fieldErrors.logo}>
              <SingleImageInput
                id="exp-logo"
                value={form.entry.logo ?? ""}
                file={logoFile}
                placeholder="/images/logos/example.png"
                invalid={!!fieldErrors.logo}
                onChange={(logo) => setEntry({ logo })}
                onFileChange={setLogoFile}
              />
            </Field>
          </FormSection>

          <FormSection title="Employers page">
            <Field label="Summary" htmlFor="exp-summary" full hint="Card blurb and search-engine description. Leave empty to use “Role at Company · period”.">
              <textarea id="exp-summary" value={form.entry.summary ?? ""} onChange={(e) => setEntry({ summary: e.target.value })} rows={2} className={fieldClass(null, "resize-y")} />
            </Field>
            <Field label="Photo gallery" full>
              <ImageListInput
                images={form.entry.photos ?? []}
                pending={photoFiles}
                placeholder="/images/experience/example.png"
                onChange={(photos) => setEntry({ photos })}
                onPendingChange={setPhotoFiles}
              />
            </Field>
            <Field label="Related content" full>
              <RelatedMultiSelect value={form.entry.related ?? {}} onChange={(related) => setEntry({ related })} />
            </Field>
          </FormSection>

          <FormSection title="Projects" columns={1}>
            {form.entry.projects.map((project, i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Project {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <IconButton onClick={() => moveProject(i, -1)} disabled={i === 0} aria-label={`Move project ${i + 1} up`} size="sm">
                      <ArrowUp size={14} />
                    </IconButton>
                    <IconButton onClick={() => moveProject(i, 1)} disabled={i === form.entry.projects.length - 1} aria-label={`Move project ${i + 1} down`} size="sm">
                      <ArrowDown size={14} />
                    </IconButton>
                    <IconButton onClick={() => removeProject(i)} aria-label={`Remove project ${i + 1}`} size="sm" tone="danger">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
                <Field label="Project name" htmlFor={`exp-project-${i}`} required error={fieldErrors[`project-${i}`]}>
                  <input id={`exp-project-${i}`} value={project.name} onChange={(e) => updateProject(i, { name: e.target.value })} className={fieldClass(fieldErrors[`project-${i}`])} />
                </Field>
                <Field label="Description (optional)">
                  <textarea value={project.description ?? ""} onChange={(e) => updateProject(i, { description: e.target.value })} rows={2} className={fieldClass(null, "resize-y")} />
                </Field>
                <Field label="Technologies (comma separated)">
                  <input
                    value={form.techText[i] ?? ""}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, techText: prev.techText.map((t, idx) => (idx === i ? e.target.value : t)) } : prev))}
                    placeholder=".NET Core, React, PostgreSQL"
                    className={fieldClass()}
                  />
                </Field>
                <Field label="Highlights (one per line)">
                  <textarea
                    value={form.highlightsText[i] ?? ""}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, highlightsText: prev.highlightsText.map((t, idx) => (idx === i ? e.target.value : t)) } : prev))}
                    rows={5}
                    className={fieldClass(null, "resize-y")}
                  />
                </Field>
              </div>
            ))}
            {form.entry.projects.length === 0 && <p className="text-muted text-xs">No projects yet.</p>}
            <button type="button" onClick={addProject} className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover">
              <Plus size={14} /> Add project
            </button>
          </FormSection>

          <FormActions
            saving={saving}
            dirty={dirty}
            onSave={() => void handleSave()}
            onCancel={cancelEdit}
            onDuplicate={!isNew ? () => duplicate(form.entry) : undefined}
          />
        </EditorPanel>
      ) : (
        <EntryList<Entry>
          items={entries}
          loading={crud.loading}
          getKey={(entry) => entry.id}
          getTitle={(entry) => entry.company}
          getSubtitle={(entry) => `${entry.role} · ${entry.period} · ${entry.projects.length} ${entry.projects.length === 1 ? "project" : "projects"}`}
          getThumbnail={(entry) => entry.logo}
          isDraft={(entry) => entry.published === false}
          getSearchText={(entry) => [entry.location, ...entry.projects.map((p) => p.name)].join(" ")}
          getViewUrl={(entry) => `/employers/${employerSlug(entry)}`}
          onMove={crud.moveEntry}
          onEdit={startEdit}
          onDelete={(entry) => void handleDelete(entry)}
          onDuplicate={duplicate}
          onNew={startNew}
          orderDirty={crud.orderDirty}
          saving={saving}
          onSaveOrder={() => void crud.saveOrder()}
          onDiscardOrder={crud.discardOrder}
          titleHeading="Company"
        />
      )}
    </div>
  );
}
