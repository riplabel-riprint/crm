"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus, ProjectPriority } from "@/types/projects";

const ALL_STATUSES: (ProjectStatus | "Wszystkie")[] = [
  "Wszystkie",
  "W realizacji",
  "Planowanie",
  "Zakończony",
  "Wstrzymany",
];

const STATUS_STYLES: Record<ProjectStatus, { bg: string; color: string }> = {
  "W realizacji": { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  "Planowanie": { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  "Zakończony": { bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  "Wstrzymany": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
};

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  "Krytyczny": { bg: "rgba(255,85,85,0.12)", color: "#ff5555" },
  "Wysoki": { bg: "rgba(255,107,53,0.12)", color: "#ff6b35" },
  "Średni": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  "Niski": { bg: "rgba(107,114,128,0.12)", color: "#9ca3af" },
};

const COVER_OPTIONS: { color: string; icon: string }[] = [
  { color: "#6d28d9", icon: "💻" },
  { color: "#0e7490", icon: "📦" },
  { color: "#b45309", icon: "📈" },
  { color: "#be185d", icon: "🎨" },
  { color: "#15803d", icon: "🛠️" },
  { color: "#1d4ed8", icon: "🚀" },
];

function formatPLN(v: number) {
  return v.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(project: Project) {
  if (project.status === "Zakończony") return false;
  return new Date(project.dueDate) < new Date();
}

type Props = { projects: Project[] };

export function ProjectsScreen({ projects }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "Wszystkie">("Wszystkie");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState(projects);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Wszystkie: localProjects.length };
    for (const s of ALL_STATUSES.slice(1) as ProjectStatus[]) {
      c[s] = localProjects.filter((p) => p.status === s).length;
    }
    return c;
  }, [localProjects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return localProjects.filter((p) => {
      const matchStatus = statusFilter === "Wszystkie" || p.status === statusFilter;
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.number.toLowerCase().includes(q) ||
        p.manager.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [localProjects, search, statusFilter]);

  function handleDelete(id: string) {
    setLocalProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  function handleCreate(input: NewProjectInput) {
    const cover = COVER_OPTIONS[localProjects.length % COVER_OPTIONS.length];
    const today = new Date().toISOString().slice(0, 10);
    const project: Project = {
      id: `proj-${Date.now()}`,
      number: `PRJ-${String(localProjects.length + 1).padStart(3, "0")}`,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      department: input.department,
      manager: input.manager,
      budget: input.budget,
      spent: 0,
      startDate: today,
      assignedDate: today,
      dueDate: input.dueDate,
      coverColor: cover.color,
      coverIcon: cover.icon,
      deliverables: [],
      members: [],
      files: [],
      tasks: [],
      activity: [],
    };
    setLocalProjects((prev) => [project, ...prev]);
    setCreateOpen(false);
  }

  return (
    <div className="min-h-full" style={{ background: "#0f0f0f", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "32px 32px 0", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              Projekty
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
              {localProjects.length === 0
                ? "Brak projektów"
                : `${localProjects.length} ${localProjects.length === 1 ? "projekt" : localProjects.length < 5 ? "projekty" : "projektów"} łącznie`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#ff6b35", color: "#fff", fontSize: "13px", fontWeight: 600,
              padding: "10px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ff5520";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ff6b35";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nowy projekt
          </button>
        </div>

        {/* Search */}
        <SearchInput value={search} onChange={setSearch} />

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px", paddingBottom: "16px" }}>
          {ALL_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={s}
              count={counts[s] ?? 0}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px 48px" }}>
        {/* Stats */}
        <StatsGrid projects={localProjects} />

        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>
              {statusFilter === "Wszystkie" ? "Wszystkie projekty" : statusFilter}
              {search && ` — wyniki dla "${search}"`}
            </h2>
            <span style={{ fontSize: "12px", color: "#555" }}>{filtered.length} wyników</span>
          </div>

          {filtered.length === 0 ? (
            <NoResults onClear={() => { setSearch(""); setStatusFilter("Wszystkie"); }} />
          ) : (
            <ProjectsTable
              projects={filtered}
              onNavigate={(id) => router.push(`/projects/${id}`)}
              onDeleteRequest={setDeleteTarget}
            />
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal
          project={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {createOpen && (
        <CreateProjectModal
          onCreate={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#555" }}
        width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Szukaj projektu..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: "#1a1a1a",
          border: `1px solid ${focused ? "#ff6b35" : "#2a2a2a"}`,
          borderRadius: "8px", padding: "10px 12px 10px 42px",
          fontSize: "13px", color: "#fff", outline: "none",
          boxShadow: focused ? "0 0 0 2px rgba(255,107,53,0.15)" : "none",
          transition: "all 0.2s ease", boxSizing: "border-box",
        }}
      />
      {value && (
        <button onClick={() => onChange("")}
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "16px", lineHeight: 1, padding: "2px" }}>
          ×
        </button>
      )}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px",
        borderRadius: "20px", border: `1px solid ${active ? "#ff6b35" : hovered ? "#ff6b35" : "#2a2a2a"}`,
        background: active ? "#ff6b35" : "transparent",
        color: active ? "#fff" : hovered ? "#e0e0e0" : "#b0b0b0",
        fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease",
      }}>
      {label}
      <span style={{ background: active ? "rgba(0,0,0,0.2)" : "#252525", color: active ? "#fff" : "#666", borderRadius: "10px", padding: "0 6px", fontSize: "11px", minWidth: "18px", textAlign: "center" }}>
        {count}
      </span>
    </button>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsGrid({ projects }: { projects: Project[] }) {
  const inProgress = projects.filter((p) => p.status === "W realizacji").length;
  const completed = projects.filter((p) => p.status === "Zakończony").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const pct = projects.length > 0 ? Math.round((completed / projects.length) * 100) : 0;

  const stats = [
    { label: "Łącznie projektów", value: String(projects.length), sub: "Wszystkie statusy", color: "#fff" },
    { label: "W realizacji", value: String(inProgress), sub: "Aktywne projekty", color: "#3b82f6" },
    { label: "Zakończone", value: String(completed), sub: `${pct}% ukończonych`, color: "#4ade80" },
    { label: "Łączny budżet", value: formatPLN(totalBudget), sub: "Wszystkie projekty", color: "#ff6b35" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "8px", padding: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>{s.label}</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: s.color, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{s.value}</p>
          <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function ProjectsTable({ projects, onNavigate, onDeleteRequest }: {
  projects: Project[];
  onNavigate: (id: string) => void;
  onDeleteRequest: (p: Project) => void;
}) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#212121" }}>
              {["#", "Projekt", "Kierownik / Dział", "Postęp budżetu", "Status", "Priorytet", "Termin"].map((h) => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #2a2a2a", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
              <th style={{ padding: "11px 16px", borderBottom: "1px solid #2a2a2a", width: "40px" }} />
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <ProjectRow
                key={p.id}
                project={p}
                isLast={idx === projects.length - 1}
                onNavigate={() => onNavigate(p.id)}
                onDeleteRequest={() => onDeleteRequest(p)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectRow({ project: p, isLast, onNavigate, onDeleteRequest }: {
  project: Project;
  isLast: boolean;
  onNavigate: () => void;
  onDeleteRequest: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const overdue = isOverdue(p);
  const budgetPct = Math.min(Math.round((p.spent / p.budget) * 100), 100);
  const budgetOver = p.spent > p.budget;

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
      style={{ borderBottom: isLast ? "none" : "1px solid #222", background: hovered ? "#1e1e1e" : "transparent", cursor: "pointer", transition: "background 0.15s ease" }}
    >
      <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap" }}>
        {p.number}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: p.coverColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
            {p.coverIcon}
          </div>
          <p style={{ margin: 0, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
            {p.title}
          </p>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <p style={{ margin: 0, color: "#ccc", fontSize: "13px" }}>{p.manager}</p>
        <p style={{ margin: "2px 0 0", color: "#555", fontSize: "11px" }}>{p.department}</p>
      </td>
      <td style={{ padding: "12px 16px", minWidth: "160px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "11px", color: budgetOver ? "#ff5555" : "#888" }}>
            {formatPLN(p.spent)} / {formatPLN(p.budget)}
          </span>
          <span style={{ fontSize: "10px", color: budgetOver ? "#ff5555" : "#555" }}>{budgetPct}%</span>
        </div>
        <div style={{ height: "4px", background: "#252525", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${budgetPct}%`, background: budgetOver ? "#ff5555" : budgetPct > 80 ? "#f59e0b" : "#4ade80", borderRadius: "2px", transition: "width 0.3s ease" }} />
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={p.status} />
      </td>
      <td style={{ padding: "12px 16px" }}>
        <PriorityBadge priority={p.priority} />
      </td>
      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
        <span style={{ color: overdue ? "#ff5555" : "#666", fontSize: "12px", fontWeight: overdue ? 600 : 400 }}>
          {overdue && "⚠ "}{formatDate(p.dueDate)}
        </span>
      </td>
      <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onDeleteRequest}
          style={{ background: "none", border: "none", cursor: "pointer", color: hovered ? "#ff5555" : "#333", padding: "4px", borderRadius: "4px", transition: "color 0.2s ease", display: "flex", alignItems: "center" }}
          title="Usuń">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 3.5h11M4.5 3.5V2.5A1 1 0 015.5 1.5h3a1 1 0 011 1V3.5M5.5 6v4M8.5 6v4M2.5 3.5l.8 8.2a1 1 0 001 .8h5.4a1 1 0 001-.8l.8-8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.color, fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY_STYLES[priority] ?? { bg: "rgba(107,114,128,0.12)", color: "#9ca3af" };
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.color, fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

// ─── No results ───────────────────────────────────────────────────────────────

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", background: "#1a1a1a", border: "1px solid #252525", borderRadius: "8px", textAlign: "center" }}>
      <span style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>🔍</span>
      <p style={{ color: "#555", fontSize: "14px", margin: "0 0 16px" }}>Brak wyników dla podanych kryteriów</p>
      <button type="button" onClick={onClear}
        style={{ background: "none", border: "1px solid #333", borderRadius: "6px", padding: "7px 14px", color: "#888", fontSize: "12px", cursor: "pointer" }}>
        Wyczyść filtry
      </button>
    </div>
  );
}

// ─── Create project modal ─────────────────────────────────────────────────────

type NewProjectInput = {
  title: string;
  description: string;
  manager: string;
  department: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  dueDate: string;
};

const STATUS_OPTIONS: ProjectStatus[] = ["Planowanie", "W realizacji", "Wstrzymany", "Zakończony"];
const PRIORITY_OPTIONS: ProjectPriority[] = ["Niski", "Średni", "Wysoki", "Krytyczny"];

const fieldLabelStyle: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 500, color: "#888", marginBottom: "6px" };
const fieldInputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px",
  padding: "9px 12px", fontSize: "13px", color: "#fff", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

function CreateProjectModal({ onCreate, onCancel }: { onCreate: (input: NewProjectInput) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Planowanie");
  const [priority, setPriority] = useState<ProjectPriority>("Średni");
  const [budget, setBudget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Podaj nazwę projektu."); return; }
    if (!dueDate) { setError("Podaj termin realizacji."); return; }
    const budgetValue = Number(budget.replace(",", "."));
    if (!budget || isNaN(budgetValue) || budgetValue < 0) { setError("Podaj prawidłowy budżet."); return; }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      manager: manager.trim() || "—",
      department: department.trim() || "—",
      status,
      priority,
      budget: budgetValue,
      dueDate,
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <form
        onSubmit={handleSubmit}
        style={{
          position: "relative", width: "min(480px, 100%)", maxHeight: "calc(100vh - 64px)", overflowY: "auto",
          background: "#141414", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px", zIndex: 10,
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#fff" }}>Nowy projekt</h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#666" }}>Uzupełnij podstawowe dane, aby utworzyć projekt.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={fieldLabelStyle}>Nazwa projektu *</label>
            <input style={fieldInputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Redesign strony internetowej" />
          </div>

          <div>
            <label style={fieldLabelStyle}>Opis</label>
            <textarea style={{ ...fieldInputStyle, resize: "vertical", minHeight: "64px" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krótki opis zakresu projektu" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={fieldLabelStyle}>Kierownik</label>
              <input style={fieldInputStyle} value={manager} onChange={(e) => setManager(e.target.value)} placeholder="np. Anna Kowalska" />
            </div>
            <div>
              <label style={fieldLabelStyle}>Dział</label>
              <input style={fieldInputStyle} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="np. Dział Marketingu" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={fieldLabelStyle}>Status</label>
              <select style={fieldInputStyle} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Priorytet</label>
              <select style={fieldInputStyle} value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={fieldLabelStyle}>Budżet (PLN) *</label>
              <input style={fieldInputStyle} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="np. 12000" inputMode="decimal" />
            </div>
            <div>
              <label style={fieldLabelStyle}>Termin realizacji *</label>
              <input style={fieldInputStyle} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {error && <p style={{ margin: 0, fontSize: "12px", color: "#ff5555" }}>{error}</p>}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "22px" }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "1px solid #2a2a2a", background: "none", color: "#888", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}>
            Anuluj
          </button>
          <button type="submit"
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#ff6b35", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ff5520"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ff6b35"; }}>
            Utwórz projekt
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ project, onConfirm, onCancel }: { project: Project; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "min(380px, calc(100vw - 32px))", background: "#141414", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px", zIndex: 10 }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255,85,85,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h14M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6M5 6l.9 10.1A1 1 0 006.9 17h6.2a1 1 0 001-.9L15 6" stroke="#ff5555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: "#fff" }}>Usuń projekt</h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
          Czy na pewno chcesz usunąć projekt{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>{project.number}</span>?{" "}
          Tej operacji nie można cofnąć.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "1px solid #2a2a2a", background: "none", color: "#888", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}>
            Anuluj
          </button>
          <button type="button" onClick={onConfirm}
            style={{ flex: 1, padding: "9px 16px", borderRadius: "8px", border: "none", background: "#ff5555", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e04444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ff5555"; }}>
            Usuń projekt
          </button>
        </div>
      </div>
    </div>
  );
}
