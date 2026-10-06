"use client";

import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleHelp,
  FileText,
  FolderCode,
  GraduationCap,
  Languages,
  LayoutDashboard,
  ListTree,
  ListTodo,
  LogOut,
  Menu as MenuIcon,
  MessagesSquare,
  Newspaper,
  PanelsTopLeft,
  Search,
  SearchCheck,
  Tags,
  UserRound,
  UsersRound,
  Wrench,
  Quote,
  type LucideIcon,
} from "lucide-react";
import configData from "@/content/config.json";
import adminMenuData from "@/content/admin-menu.json";
import { inputClass, TOKEN_KEY, TOKEN_CHANGED_EVENT } from "@/components/admin/shared";
import ArticleManager from "@/components/admin/ArticleManager";
import GenericArrayEditor from "@/components/admin/GenericArrayEditor";
import ExperienceManager from "@/components/admin/ExperienceManager";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import ProfileEditor from "@/components/admin/ProfileEditor";
import SkillsEditor from "@/components/admin/SkillsEditor";
import UiStringsEditor from "@/components/admin/UiStringsEditor";
import FaqScriptEditor from "@/components/admin/FaqScriptEditor";
import ChatLogViewer from "@/components/admin/ChatLogViewer";
import SearchLogViewer from "@/components/admin/SearchLogViewer";
import Dashboard from "@/components/admin/Dashboard";
import TasksManager from "@/components/admin/TasksManager";
import {
  educationConfig,
  certificationsConfig,
  clientsConfig,
  menuConfig,
  adminMenuConfig,
  proficiencyConfig,
  servicesConfig,
  sectionsConfig,
  skillCategoriesConfig,
  seoConfig,
} from "@/components/admin/arrayConfigs";

const PASSWORD_KEY = "admin_password";

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
  | "tasks"
  | "sections"
  | "skill-categories"
  | "seo"
  | "ui-strings"
  | "faq-script";

const TABS: { key: Tab; label: string; icon: string }[] = adminMenuData.tabs
  .filter((t) => t.published !== false)
  .map((t) => ({ key: t.id as Tab, label: t.label, icon: t.icon }));

const ICONS: Record<string, LucideIcon> = {
  "briefcase-business": BriefcaseBusiness,
  "book-open-check": BookOpenCheck,
  "chart-no-axes-column-increasing": ChartNoAxesColumnIncreasing,
  "circle-help": CircleHelp,
  "folder-code": FolderCode,
  "graduation-cap": GraduationCap,
  languages: Languages,
  "layout-dashboard": LayoutDashboard,
  "list-todo": ListTodo,
  "list-tree": ListTree,
  menu: MenuIcon,
  "messages-square": MessagesSquare,
  newspaper: Newspaper,
  "panels-top-left": PanelsTopLeft,
  search: Search,
  "search-check": SearchCheck,
  tags: Tags,
  "user-round": UserRound,
  "users-round": UsersRound,
  wrench: Wrench,
  quote: Quote,
};

const adminMenuIconKey = adminMenuData.tabs.find((item) => item.id === "admin-menu")?.icon;
const AdminMenuIcon = ICONS[adminMenuIconKey ?? ""] ?? CircleHelp;

export default function AdminEditor() {
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [linkedEditor, setLinkedEditor] = useState<{ tab: Tab; slug?: string; create?: boolean } | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const selectedTab = TABS.find((item) => item.key === tab);
  const SelectedTabIcon = selectedTab ? ICONS[selectedTab.icon] ?? CircleHelp : CircleHelp;

  /* eslint-disable react-hooks/set-state-in-effect -- Restore browser-only credentials after hydration. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");
    const slug = params.get("slug");
    const create = params.get("action") === "new";
    if (requestedTab && TABS.some((item) => item.key === requestedTab)) {
      setTab(requestedTab as Tab);
      const articleTab = requestedTab === "blog" || requestedTab === "case-study" || requestedTab === "projects";
      const newEntryTab = requestedTab === "certifications" || requestedTab === "experience" || requestedTab === "services";
      if ((articleTab && (slug || create)) || (newEntryTab && create)) {
        setLinkedEditor({ tab: requestedTab, ...(slug ? { slug } : { create }) });
      }
    }

    const savedPassword = localStorage.getItem(PASSWORD_KEY);
    if (savedPassword) {
      setUnlocked(true);
    }
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) setToken(savedToken);
    setCredentialsLoaded(true);
  }, []);

  useEffect(() => {
    if (!adminMenuOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !adminMenuRef.current?.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAdminMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [adminMenuOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === configData.password) {
      localStorage.setItem(PASSWORD_KEY, passwordInput);
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
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
    setToken(trimmed);
    setTokenInput("");
    setTokenError(null);
  }

  function handleAuthError() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
    setToken(null);
    setTokenError("Token rejected. It may be invalid, expired, or missing repo access — please paste a new one.");
  }

  function handleLogout() {
    localStorage.removeItem(PASSWORD_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
    setAdminMenuOpen(false);
    setPasswordInput("");
    setTokenInput("");
    setToken(null);
    setUnlocked(false);
  }

  if (!credentialsLoaded) {
    return <p role="status" className="text-muted text-sm">Loading content editor...</p>;
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto">
        {/* <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1> */}
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
      <div className="max-w-md mx-auto -mt-3">
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="shrink-0 text-2xl font-bold text-foreground">Content Editor</h1>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm font-medium text-foreground" aria-live="polite">
          <SelectedTabIcon size={17} className="shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate">{selectedTab?.label ?? "Dashboard"}</span>
        </div>
        <div className="relative" ref={adminMenuRef}>
          <button
            type="button"
            onClick={() => setAdminMenuOpen((open) => !open)}
            aria-label="Admin menu"
            aria-haspopup="menu"
            aria-expanded={adminMenuOpen}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <AdminMenuIcon size={16} aria-hidden="true" />
            <ChevronDown size={16} className={`transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {adminMenuOpen && (
            <div role="menu" aria-label="Admin menu" className="absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,32rem)] w-64 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl">
              {TABS.map((item) => {
                const Icon = ICONS[item.icon] ?? CircleHelp;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={() => { setTab(item.key); setLinkedEditor(null); setAdminMenuOpen(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${tab === item.key ? "bg-accent/10 text-accent" : "text-muted hover:bg-background hover:text-foreground"}`}
                  >
                    <Icon size={16} className="shrink-0" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
              <div className="my-2 border-t border-border" />
              <a
                href="/resume"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setAdminMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-background hover:text-foreground transition-colors"
              >
                <FileText size={15} />
                View Live Resume
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-background hover:text-foreground transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {tab === "dashboard" && <Dashboard token={token} onAuthError={handleAuthError} />}
      {tab === "blog" && (
        <ArticleManager
          key="blog"
          kind="blog"
          token={token}
          onAuthError={handleAuthError}
          initialSlug={linkedEditor?.tab === "blog" ? linkedEditor.slug : undefined}
          initialNew={linkedEditor?.tab === "blog" && linkedEditor.create === true}
        />
      )}
      {tab === "case-study" && (
        <ArticleManager
          key="case-study"
          kind="case-study"
          token={token}
          onAuthError={handleAuthError}
          initialSlug={linkedEditor?.tab === "case-study" ? linkedEditor.slug : undefined}
          initialNew={linkedEditor?.tab === "case-study" && linkedEditor.create === true}
        />
      )}
      {tab === "experience" && (
        <ExperienceManager
          token={token}
          onAuthError={handleAuthError}
          initialNew={linkedEditor?.tab === "experience" && linkedEditor.create === true}
        />
      )}
      {tab === "services" && (
        <GenericArrayEditor
          config={servicesConfig}
          token={token}
          onAuthError={handleAuthError}
          initialNew={linkedEditor?.tab === "services" && linkedEditor.create === true}
        />
      )}
      {tab === "education" && (
        <GenericArrayEditor config={educationConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "certifications" && (
        <GenericArrayEditor
          config={certificationsConfig}
          token={token}
          onAuthError={handleAuthError}
          initialNew={linkedEditor?.tab === "certifications" && linkedEditor.create === true}
        />
      )}
      {tab === "testimonials" && <TestimonialsManager token={token} onAuthError={handleAuthError} />}
      {tab === "projects" && (
        <ArticleManager
          key="project"
          kind="project"
          token={token}
          onAuthError={handleAuthError}
          initialSlug={linkedEditor?.tab === "projects" ? linkedEditor.slug : undefined}
          initialNew={linkedEditor?.tab === "projects" && linkedEditor.create === true}
        />
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
      {tab === "sections" && (
        <GenericArrayEditor config={sectionsConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "skill-categories" && (
        <GenericArrayEditor config={skillCategoriesConfig} token={token} onAuthError={handleAuthError} />
      )}
      {tab === "seo" && <GenericArrayEditor config={seoConfig} token={token} onAuthError={handleAuthError} />}
      {tab === "ui-strings" && <UiStringsEditor token={token} onAuthError={handleAuthError} />}
      {tab === "faq-script" && <FaqScriptEditor token={token} onAuthError={handleAuthError} />}
    </div>
  );
}
