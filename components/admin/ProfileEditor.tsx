"use client";

import { useEffect, useState } from "react";
import {
  fetchContentFile,
  updateContentFile,
  uploadBinaryFile,
  deleteBinaryFile,
  GitHubApiError,
} from "@/lib/github";
import { ExternalLink, Upload } from "lucide-react";
import { inputClass, fileToBase64 } from "@/components/admin/shared";

interface ProfileForm {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: string;
  projectsCompleted: string;
  resumeUrl: string;
  portfolioUrl: string;
  social: { github: string; linkedin: string; leetcode: string; upwork: string };
}

const PATH = "content/profile.json";
const KNOWN_KEYS = new Set([
  "name",
  "title",
  "tagline",
  "bio",
  "avatar",
  "email",
  "phone",
  "location",
  "yearsOfExperience",
  "projectsCompleted",
  "resumeUrl",
  "portfolioUrl",
  "social",
]);

function blankForm(): ProfileForm {
  return {
    name: "",
    title: "",
    tagline: "",
    bio: "",
    avatar: "",
    email: "",
    phone: "",
    location: "",
    yearsOfExperience: "0",
    projectsCompleted: "0",
    resumeUrl: "",
    portfolioUrl: "",
    social: { github: "", linkedin: "", leetcode: "", upwork: "" },
  };
}

interface ProfileEditorProps {
  token: string;
  onAuthError: () => void;
}

export default function ProfileEditor({ token, onAuthError }: ProfileEditorProps) {
  const [form, setForm] = useState<ProfileForm>(blankForm());
  const [rawExtra, setRawExtra] = useState<Record<string, unknown>>({});
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { content, sha } = await fetchContentFile(PATH, token);
      const parsed = JSON.parse(content);
      setForm({
        name: parsed.name ?? "",
        title: parsed.title ?? "",
        tagline: parsed.tagline ?? "",
        bio: parsed.bio ?? "",
        avatar: parsed.avatar ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? "",
        location: parsed.location ?? "",
        yearsOfExperience: String(parsed.yearsOfExperience ?? 0),
        projectsCompleted: String(parsed.projectsCompleted ?? 0),
        resumeUrl: parsed.resumeUrl ?? "",
        portfolioUrl: parsed.portfolioUrl ?? "",
        social: {
          github: parsed.social?.github ?? "",
          linkedin: parsed.social?.linkedin ?? "",
          leetcode: parsed.social?.leetcode ?? "",
          upwork: parsed.social?.upwork ?? "",
        },
      });
      const extra: Record<string, unknown> = {};
      for (const k of Object.keys(parsed)) if (!KNOWN_KEYS.has(k)) extra[k] = parsed[k];
      setRawExtra(extra);
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
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    const oldAvatar = form.avatar;
    let avatar = form.avatar;
    const oldResumeUrl = form.resumeUrl;
    let resumeUrl = form.resumeUrl;
    setSaving(true);
    setError(null);
    try {
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
        const repoPath = `public/images/profile-avatar.${ext}`;
        const base64 = await fileToBase64(avatarFile);
        await uploadBinaryFile(repoPath, base64, "content: update profile avatar", token);
        avatar = `/images/profile-avatar.${ext}`;
      }

      if (resumeFile) {
        const ext = resumeFile.name.split(".").pop()?.toLowerCase() || "pdf";
        const repoPath = `public/resume.${ext}`;
        const base64 = await fileToBase64(resumeFile);
        await uploadBinaryFile(repoPath, base64, "content: update resume", token);
        resumeUrl = `/resume.${ext}`;
      }

      const payload = {
        ...rawExtra,
        name: form.name.trim(),
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        bio: form.bio,
        avatar,
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        projectsCompleted: Number(form.projectsCompleted) || 0,
        social: {
          github: form.social.github.trim(),
          linkedin: form.social.linkedin.trim(),
          leetcode: form.social.leetcode.trim(),
          upwork: form.social.upwork.trim(),
        },
        resumeUrl: resumeUrl.trim(),
        portfolioUrl: form.portfolioUrl.trim(),
      };

      const content = JSON.stringify(payload, null, 2) + "\n";
      await updateContentFile(PATH, content, fileSha, "content: update profile", token);
      setAvatarFile(null);
      setResumeFile(null);
      setSuccessMsg(
        "Saved and committed. The site will redeploy automatically — check the Actions tab in a minute or two."
      );

      if (avatarFile && oldAvatar && oldAvatar !== avatar && oldAvatar.startsWith("/images/profile-avatar.")) {
        try {
          await deleteBinaryFile(`public${oldAvatar}`, "content: remove orphaned profile avatar", token);
        } catch {
          // Best-effort cleanup — the profile update already succeeded either way.
        }
      }

      if (resumeFile && oldResumeUrl && oldResumeUrl !== resumeUrl && oldResumeUrl.startsWith("/resume.")) {
        try {
          await deleteBinaryFile(`public${oldResumeUrl}`, "content: remove orphaned resume", token);
        } catch {
          // Best-effort cleanup — the profile update already succeeded either way.
        }
      }

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

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        </div>
        <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={8}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field
            label="Years of Experience"
            value={form.yearsOfExperience}
            onChange={(v) => setForm({ ...form, yearsOfExperience: v })}
          />
          <Field
            label="Projects Completed"
            value={form.projectsCompleted}
            onChange={(v) => setForm({ ...form, projectsCompleted: v })}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-muted mb-1">Avatar URL</label>
          <input
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className={inputClass}
          />
          <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
            <Upload size={16} className="text-muted shrink-0" />
            <span className="truncate">{avatarFile ? avatarFile.name : "Or upload an image file…"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="GitHub URL"
            value={form.social.github}
            onChange={(v) => setForm({ ...form, social: { ...form.social, github: v } })}
          />
          <Field
            label="LinkedIn URL"
            value={form.social.linkedin}
            onChange={(v) => setForm({ ...form, social: { ...form.social, linkedin: v } })}
          />
          <Field
            label="LeetCode URL"
            value={form.social.leetcode}
            onChange={(v) => setForm({ ...form, social: { ...form.social, leetcode: v } })}
          />
          <Field
            label="Upwork URL"
            value={form.social.upwork}
            onChange={(v) => setForm({ ...form, social: { ...form.social, upwork: v } })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1">Resume URL</label>
            <input
              value={form.resumeUrl}
              onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
              className={inputClass}
            />
            <label className={`${inputClass} mt-2 flex items-center gap-2 cursor-pointer`}>
              <Upload size={16} className="text-muted shrink-0" />
              <span className="truncate">{resumeFile ? resumeFile.name : "Or upload a PDF…"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <Field
            label="Portfolio URL"
            value={form.portfolioUrl}
            onChange={(v) => setForm({ ...form, portfolioUrl: v })}
          />
        </div>

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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-muted mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}
