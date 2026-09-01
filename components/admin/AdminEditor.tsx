"use client";

import { useEffect, useState } from "react";
import { LogOut, FileText } from "lucide-react";
import configData from "@/content/config.json";
import adminMenuData from "@/content/admin-menu.json";
import { inputClass, TOKEN_KEY } from "@/components/admin/shared";
import BlogCaseStudyManager from "@/components/admin/BlogCaseStudyManager";
import GenericArrayEditor from "@/components/admin/GenericArrayEditor";
import ExperienceManager from "@/components/admin/ExperienceManager";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import ProfileEditor from "@/components/admin/ProfileEditor";
import SkillsEditor from "@/components/admin/SkillsEditor";
import ChatLogViewer from "@/components/admin/ChatLogViewer";
import SearchLogViewer from "@/components/admin/SearchLogViewer";
import Dashboard from "@/components/admin/Dashboard";
import TasksManager from "@/components/admin/TasksManager";
import {
  educationConfig,
  certificationsConfig,
  projectsConfig,
  clientsConfig,
  menuConfig,
  adminMenuConfig,
  proficiencyConfig,
  servicesConfig,
} from "@/components/admin/arrayConfigs";

const PASSWORD_OK_KEY = "admin_pw_ok";

type Tab =
  | "dashboard"
  | "blog"
  | "case-study"
  | "experience"
  | "services"
  | "education"
  | "certifications"
  | "testimonials"
  | "projects"
  | "clients"
  | "menu"
  | "profile"
  | "skills"
  | "proficiency"
  | "admin-menu"
  | "chat-log"
  | "search-log"
  | "tasks";

const TABS: { key: Tab; label: string }[] = adminMenuData.tabs
  .filter((t) => t.published !== false)
  .map((t) => ({ key: t.id as Tab, label: t.label }));

export default function AdminEditor() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (sessionStorage.getItem(PASSWORD_OK_KEY) === "1") setUnlocked(true);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) setToken(savedToken);
  }, []);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === configData.password) {
      sessionStorage.setItem(PASSWORD_OK_KEY, "1");
      setUnlocked(true);
      setPasswordError(null);
      setPasswordInput("");
    } else {
      setPasswordError("Incorrect password.");
    }
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    localStorage.setItem(TOKEN_KEY, trimmed);
    setToken(trimmed);
    setTokenInput("");
    setTokenError(null);
  }

  function handleAuthError() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTokenError("Token rejected. It may be invalid, expired, or missing repo access — please paste a new one.");
  }

  function handleLogout() {
    sessionStorage.removeItem(PASSWORD_OK_KEY);
    setUnlocked(false);
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1>
        <p className="text-muted text-sm mb-6">Enter the admin password to continue.</p>
        {passwordError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {passwordError}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Password"
            className={inputClass}
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1>
        <p className="text-muted text-sm mb-6">Paste Token</p>
        {tokenError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {tokenError}
          </div>
        )}
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="github_pat_..."
            className={inputClass}
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Content Editor</h1>
        <div className="flex items-center gap-4">
          <a
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <FileText size={14} />
            View Live Resume
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard token={token} onAuthError={handleAuthError} />}
      {tab === "blog" && <BlogCaseStudyManager kind="blog" token={token} onAuthError={handleAuthError} />}
      {tab === "case-study" && (
        <BlogCaseStudyManager kind="case-study" token={token} onAuthError={handleAuthError} />
      )}
      {tab === "experience" && <ExperienceManager token={token} onAuthError={handleAuthError} />}
      {tab === "services" && (
        <GenericArrayEditor config={servicesConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "education" && (
        <GenericArrayEditor config={educationConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "certifications" && (
        <GenericArrayEditor config={certificationsConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "testimonials" && <TestimonialsManager token={token} onAuthError={handleAuthError} />}
      {tab === "projects" && (
        <GenericArrayEditor config={projectsConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "clients" && (
        <GenericArrayEditor config={clientsConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "menu" && <GenericArrayEditor config={menuConfig} token={token} onAuthError={handleAuthError} />}
      {tab === "admin-menu" && (
        <GenericArrayEditor config={adminMenuConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "profile" && <ProfileEditor token={token} onAuthError={handleAuthError} />}
      {tab === "skills" && <SkillsEditor token={token} onAuthError={handleAuthError} />}
      {tab === "proficiency" && (
        <GenericArrayEditor config={proficiencyConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "chat-log" && <ChatLogViewer token={token} onAuthError={handleAuthError} />}
      {tab === "search-log" && <SearchLogViewer token={token} onAuthError={handleAuthError} />}
      {tab === "tasks" && <TasksManager token={token} onAuthError={handleAuthError} />}
    </div>
  );
}
