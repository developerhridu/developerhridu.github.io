"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  BookOpenCheck,
  ChartNoAxesColumnIncreasing,
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
  award: Award,
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
  const tabListRef = useRef<HTMLElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);

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

  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const tabList = tabListRef.current;
    const selectedTab = selectedTabRef.current;
    if (!tabList || !selectedTab) return;

    const listBounds = tabList.getBoundingClientRect();
    const selectedBounds = selectedTab.getBoundingClientRect();
    if (selectedBounds.left < listBounds.left) {
      tabList.scrollLeft -= listBounds.left - selectedBounds.left;
    } else if (selectedBounds.right > listBounds.right) {
      tabList.scrollLeft += selectedBounds.right - listBounds.right;
    }
  }, [tab, token]);

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
        {/* <h1 className="text-2xl font-bold text-foreground mb-2">Content Editor</h1> */}
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
      <div className="mb-6 flex min-w-0 items-center gap-3">
        {/* <h1 className="shrink-0 text-lg font-bold text-foreground sm:text-2xl">Content Editor</h1> */}
        <nav ref={tabListRef} aria-label="Content editor sections" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
          {TABS.map((item) => {
            const Icon = ICONS[item.icon] ?? CircleHelp;
            const selected = tab === item.key;
            return (
              <button
                key={item.key}
                ref={selected ? selectedTabRef : undefined}
                type="button"
                aria-label={item.label}
                aria-pressed={selected}
                title={item.label}
                onClick={() => { setTab(item.key); setLinkedEditor(null); }}
                className={`flex shrink-0 items-center justify-center rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected ? "bg-accent/10 text-accent" : "text-muted hover:bg-background hover:text-foreground"}`}
              >
                <Icon size={18} aria-hidden="true" />
              </button>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View live resume"
            title="View live resume"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <FileText size={18} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
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
