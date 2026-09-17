"use client";

import { useEffect, useState } from "react";
import { fetchContentFile, updateContentFile, GitHubApiError } from "@/lib/github";
import { ExternalLink } from "lucide-react";
import { inputClass } from "@/components/admin/shared";

const PATH = "content/ui-strings.json";

interface FieldDef {
  section: string;
  key: string;
  label: string;
  multiline?: boolean;
}

const FIELDS: FieldDef[] = [
  { section: "hero", key: "greeting", label: "Hero: Greeting" },
  { section: "hero", key: "ctaViewProjects", label: "Hero: View Projects button" },
  { section: "hero", key: "ctaHireMe", label: "Hero: Hire Me button" },
  { section: "hero", key: "ctaViewResume", label: "Hero: View Resume button" },
  { section: "hero", key: "statYearsExperience", label: "Hero: Years Experience stat label" },
  { section: "hero", key: "statProjectsCompleted", label: "Hero: Projects Completed stat label" },
  { section: "hero", key: "statClients", label: "Hero: Clients stat label" },

  { section: "about", key: "techStackHeading", label: "About: Tech Stack heading" },
  { section: "about", key: "skillProficiencyHeading", label: "About: Skill Proficiency heading" },

  { section: "experience", key: "showLess", label: "Experience: Show less" },
  { section: "experience", key: "readMore", label: "Experience: Read more ({count} placeholder)" },
  { section: "experience", key: "verify", label: "Experience: Verify link" },
  { section: "experience", key: "viewFullExperience", label: "Experience: View Full Experience link" },

  { section: "projects", key: "otherProjects", label: "Projects: Other Projects heading" },
  { section: "projects", key: "liveDemo", label: "Projects: Live Demo link" },
  { section: "projects", key: "sourceCode", label: "Projects: Source Code link" },
  { section: "projects", key: "viewCode", label: "Projects: View Code link" },
  { section: "projects", key: "frontEnd", label: "Projects: Front-End link" },
  { section: "projects", key: "backEnd", label: "Projects: Back-End link" },

  { section: "projectModal", key: "liveDemo", label: "Project Modal: Live Demo label" },
  { section: "projectModal", key: "viewLive", label: "Project Modal: View Live link" },
  { section: "projectModal", key: "sourceCode", label: "Project Modal: Source Code label" },
  { section: "projectModal", key: "viewCode", label: "Project Modal: View Code link" },
  { section: "projectModal", key: "frontEnd", label: "Project Modal: Front-End link" },
  { section: "projectModal", key: "backEnd", label: "Project Modal: Back-End link" },
  { section: "projectModal", key: "closeAriaLabel", label: "Project Modal: Close button aria-label" },

  { section: "certifications", key: "verify", label: "Certifications: Verify link" },

  { section: "educationCertifications", key: "tabEducationLabel", label: "Education/Certs: Education tab label" },
  { section: "educationCertifications", key: "tabEducationNumber", label: "Education/Certs: Education tab number" },
  {
    section: "educationCertifications",
    key: "tabCertificationsLabel",
    label: "Education/Certs: Certifications tab label",
  },
  {
    section: "educationCertifications",
    key: "tabCertificationsNumber",
    label: "Education/Certs: Certifications tab number",
  },

  { section: "contact", key: "letsConnectTitle", label: "Contact: Let's Connect title" },
  { section: "contact", key: "letsConnectIntro", label: "Contact: Intro paragraph", multiline: true },
  { section: "contact", key: "emailLabel", label: "Contact: Email label" },
  { section: "contact", key: "locationLabel", label: "Contact: Location label" },
  { section: "contact", key: "sendMessageTitle", label: "Contact: Send a Message title" },
  { section: "contact", key: "messageSentTitle", label: "Contact: Message Sent title" },
  { section: "contact", key: "messageSentBody", label: "Contact: Message Sent body" },
  { section: "contact", key: "sendAnotherMessage", label: "Contact: Send another message link" },
  { section: "contact", key: "nameLabel", label: "Contact: Name field label" },
  { section: "contact", key: "namePlaceholder", label: "Contact: Name field placeholder" },
  { section: "contact", key: "emailFieldLabel", label: "Contact: Email field label" },
  { section: "contact", key: "emailPlaceholder", label: "Contact: Email field placeholder" },
  { section: "contact", key: "messageLabel", label: "Contact: Message field label" },
  { section: "contact", key: "messagePlaceholder", label: "Contact: Message field placeholder" },
  { section: "contact", key: "errorText", label: "Contact: Error text" },
  { section: "contact", key: "sending", label: "Contact: Sending… state" },
  { section: "contact", key: "sendMessageButton", label: "Contact: Send Message button" },

  { section: "testimonialSubmit", key: "thankYouTitle", label: "Testimonial Submit: Thank you title" },
  { section: "testimonialSubmit", key: "thankYouBody", label: "Testimonial Submit: Thank you body" },
  { section: "testimonialSubmit", key: "submitAnother", label: "Testimonial Submit: Submit another link" },
  { section: "testimonialSubmit", key: "notConfiguredTitle", label: "Testimonial Submit: Not configured title" },
  {
    section: "testimonialSubmit",
    key: "notConfiguredBody",
    label: "Testimonial Submit: Not configured body",
    multiline: true,
  },
  { section: "testimonialSubmit", key: "nameLabel", label: "Testimonial Submit: Name label" },
  { section: "testimonialSubmit", key: "namePlaceholder", label: "Testimonial Submit: Name placeholder" },
  { section: "testimonialSubmit", key: "emailLabel", label: "Testimonial Submit: Email label" },
  { section: "testimonialSubmit", key: "emailPlaceholder", label: "Testimonial Submit: Email placeholder" },
  { section: "testimonialSubmit", key: "roleLabel", label: "Testimonial Submit: Role label" },
  { section: "testimonialSubmit", key: "rolePlaceholder", label: "Testimonial Submit: Role placeholder" },
  { section: "testimonialSubmit", key: "companyLabel", label: "Testimonial Submit: Company label" },
  { section: "testimonialSubmit", key: "companyPlaceholder", label: "Testimonial Submit: Company placeholder" },
  { section: "testimonialSubmit", key: "linkedinLabel", label: "Testimonial Submit: LinkedIn label" },
  { section: "testimonialSubmit", key: "linkedinPlaceholder", label: "Testimonial Submit: LinkedIn placeholder" },
  { section: "testimonialSubmit", key: "quoteLabel", label: "Testimonial Submit: Quote label" },
  { section: "testimonialSubmit", key: "quotePlaceholder", label: "Testimonial Submit: Quote placeholder" },
  { section: "testimonialSubmit", key: "errorText", label: "Testimonial Submit: Error text" },
  { section: "testimonialSubmit", key: "submitting", label: "Testimonial Submit: Submitting… state" },
  { section: "testimonialSubmit", key: "submitButton", label: "Testimonial Submit: Submit button" },

  { section: "testimonials", key: "shareCta", label: "Testimonials: Share your experience CTA" },

  { section: "caseStudies", key: "viewAll", label: "Case Studies: View All link" },

  { section: "blogCaseStudyListing", key: "mostRead", label: "Listing: Most Read label" },
  { section: "blogCaseStudyListing", key: "allTag", label: "Listing: All tag filter" },
  { section: "blogCaseStudyListing", key: "readMore", label: "Listing: Read more link" },

  { section: "", key: "blogEmptyMessage", label: "Blog: Empty state message" },
  { section: "", key: "caseStudiesEmptyMessage", label: "Case Studies: Empty state message" },

  { section: "searchPalette", key: "placeholder", label: "Search: Input placeholder" },
  { section: "searchPalette", key: "closeAriaLabel", label: "Search: Close button aria-label" },
  { section: "searchPalette", key: "noResults", label: "Search: No results ({query} placeholder)" },
  { section: "searchPalette", key: "askAi", label: "Search: Ask AI ({query} placeholder)" },
  { section: "searchPalette", key: "navigateHint", label: "Search: Navigate hint" },
  { section: "searchPalette", key: "selectHint", label: "Search: Select hint" },
  { section: "searchPalette", key: "closeHint", label: "Search: Close hint" },

  { section: "aiChatWidget", key: "headerTitle", label: "AI Chat: Header title" },
  { section: "aiChatWidget", key: "closeChatAriaLabel", label: "AI Chat: Close button aria-label" },
  { section: "aiChatWidget", key: "introText", label: "AI Chat: Intro text", multiline: true },
  { section: "aiChatWidget", key: "thinking", label: "AI Chat: Thinking… state" },
  { section: "aiChatWidget", key: "inputPlaceholder", label: "AI Chat: Input placeholder" },
  { section: "aiChatWidget", key: "sendAriaLabel", label: "AI Chat: Send button aria-label" },
  { section: "aiChatWidget", key: "launcherPrompt", label: "AI Chat: Launcher prompt bubble" },
  { section: "aiChatWidget", key: "dismissAriaLabel", label: "AI Chat: Dismiss button aria-label" },
  { section: "aiChatWidget", key: "openAriaLabel", label: "AI Chat: Open button aria-label" },

  { section: "navbar", key: "searchAriaLabel", label: "Navbar: Search aria-label" },
  { section: "navbar", key: "hireMeLabel", label: "Navbar: Hire Me label" },
  { section: "navbar", key: "openMenuAriaLabel", label: "Navbar: Open menu aria-label" },
  { section: "navbar", key: "closeMenuAriaLabel", label: "Navbar: Close menu aria-label" },

  { section: "footer", key: "builtWithTemplate", label: "Footer: Copyright template ({year}/{name})" },
  { section: "footer", key: "hireMeLabel", label: "Footer: Hire Me label" },

  { section: "notFound", key: "title", label: "404: Title" },
  { section: "notFound", key: "body", label: "404: Body", multiline: true },
  { section: "notFound", key: "goHome", label: "404: Go Home button" },

  { section: "resume", key: "summary", label: "Resume: Summary heading" },
  { section: "resume", key: "technicalSkills", label: "Resume: Technical Skills heading" },
  { section: "resume", key: "experience", label: "Resume: Experience heading" },
  { section: "resume", key: "projects", label: "Resume: Projects heading" },
  { section: "resume", key: "education", label: "Resume: Education heading" },
  { section: "resume", key: "trainingAndCertifications", label: "Resume: Training and Certifications heading" },
  { section: "resume", key: "techStackLabel", label: "Resume: Tech-Stack label" },
  { section: "resume", key: "verify", label: "Resume: Verify link" },
  { section: "resume", key: "code", label: "Resume: Code link" },
  { section: "resume", key: "frontend", label: "Resume: Frontend link" },
  { section: "resume", key: "backend", label: "Resume: Backend link" },
  { section: "resume", key: "verifyBracket", label: "Resume: [Verify] link" },

  { section: "socialLabels", key: "github", label: "Social label: GitHub" },
  { section: "socialLabels", key: "linkedin", label: "Social label: LinkedIn" },
  { section: "socialLabels", key: "leetcode", label: "Social label: LeetCode" },
  { section: "socialLabels", key: "upwork", label: "Social label: Upwork" },
  { section: "socialLabels", key: "portfolio", label: "Social label: Portfolio" },
];

function fieldPath(f: FieldDef): string {
  return f.section ? `${f.section}.${f.key}` : f.key;
}

interface UiStringsEditorProps {
  token: string;
  onAuthError: () => void;
}

export default function UiStringsEditor({ token, onAuthError }: UiStringsEditorProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const next: Record<string, string> = {};
      for (const f of FIELDS) {
        const source = f.section ? (parsed[f.section] as Record<string, unknown> | undefined) : parsed;
        const value = source?.[f.key];
        next[fieldPath(f)] = typeof value === "string" ? value : "";
      }
      setForm(next);
      setFileSha(sha);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleApiError(err: unknown) {
    if (err instanceof GitHubApiError && (err.status === 401 || err.status === 403)) {
      onAuthError();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong.");
    }
  }

  async function handleSave() {
    if (!fileSha) {
      setError("Missing file version — reload before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, Record<string, string> | string> = {};
      for (const f of FIELDS) {
        const value = form[fieldPath(f)] ?? "";
        if (f.section) {
          const bucket = (payload[f.section] as Record<string, string> | undefined) ?? {};
          bucket[f.key] = value;
          payload[f.section] = bucket;
        } else {
          payload[f.key] = value;
        }
      }
      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update UI strings", token);
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );
      await load();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
          <span>{successMsg}</span>
          <a
            href="https://github.com/developerhridu/developerhridu.github.io/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 whitespace-nowrap hover:underline"
          >
            View Actions <ExternalLink size={12} />
          </a>
        </div>
      )}

      <div className="sticky top-0 bg-background pb-2 z-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {FIELDS.map((f) => (
          <div key={fieldPath(f)}>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1">{f.label}</label>
            {f.multiline ? (
              <textarea
                value={form[fieldPath(f)] ?? ""}
                onChange={(e) => setForm({ ...form, [fieldPath(f)]: e.target.value })}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            ) : (
              <input
                value={form[fieldPath(f)] ?? ""}
                onChange={(e) => setForm({ ...form, [fieldPath(f)]: e.target.value })}
                className={inputClass}
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
