"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Project, ProjectStatus, ProjectFile } from "@/types/projects";

const STATUS_STYLES: Record<ProjectStatus, { bg: string; color: string; label: string }> = {
  "W realizacji": { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "W realizacji" },
  "Planowanie": { bg: "rgba(74,222,128,0.12)", color: "#4ade80", label: "Planowanie" },
  "Zakończony": { bg: "rgba(168,85,247,0.12)", color: "#a855f7", label: "Zakończony" },
  "Wstrzymany": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Wstrzymany" },
};

const TASK_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  "W toku": { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  "Do zrobienia": { bg: "rgba(107,114,128,0.12)", color: "#9ca3af" },
  "Ukończone": { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  "W recenzji": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
};

const FILE_CATEGORY_TABS = ["Pliki design", "Raporty", "Umowy", "Referencje"] as const;
const FILE_CATEGORY_KEYS = ["design", "reports", "contracts", "references"] as const;

const ACTIVITY_ICONS: Record<string, string> = {
  milestone: "🏁",
  file: "📎",
  task: "✅",
  comment: "💬",
  report: "📄",
  member: "👤",
  deadline: "📅",
};

function formatPLN(v: number) {
  return v.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" });
}

function getAvatarColor(name: string) {
  const colors = ["#6d28d9", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: getAvatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function ProjectDetailView({ project }: { project: Project }) {
  const [activeFileTab, setActiveFileTab] = useState(0);
  const [activitySearch, setActivitySearch] = useState("");

  const statusStyle = STATUS_STYLES[project.status];
  const budgetPct = Math.min(Math.round((project.spent / project.budget) * 100), 100);
  const budgetOver = project.spent > project.budget;

  const currentFileCategory = FILE_CATEGORY_KEYS[activeFileTab];
  const visibleFiles = project.files.filter((f) => f.category === currentFileCategory);

  const filteredActivity = project.activity.filter((a) =>
    !activitySearch ||
    a.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
    a.author.toLowerCase().includes(activitySearch.toLowerCase()) ||
    (a.tag ?? "").toLowerCase().includes(activitySearch.toLowerCase())
  );

  return (
    <div style={{ background: "#0f0f0f", color: "#fff", minHeight: "100%", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 32px 0", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "12px", color: "#555" }}>
          <Link href="/projects" style={{ color: "#555", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ff6b35"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
            Projekty
          </Link>
          <span>/</span>
          <span style={{ color: "#888" }}>{project.title}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", paddingBottom: "16px" }}>
          <ActionButton icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11h10M2 7h10M2 3h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          } label="Szczegóły wydruku" />
          <ActionButton icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7c0-2.761 2.239-5 5-5s5 2.239 5 5M7 2v10M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          } label="Udostępnij szczegóły" primary />
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "28px 32px 48px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Project card */}
          <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              {/* Cover */}
              <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: project.coverColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>
                {project.coverIcon}
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ display: "inline-block", background: statusStyle.bg, color: statusStyle.color, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "4px" }}>
                    {statusStyle.label}
                  </span>
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
                  {project.title}
                </h1>
                <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>
                  Data przypisania: {formatDate(project.assignedDate)}
                </p>
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #252525" }}>
              <MetaField label="Kierownik projektu">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <Avatar name={project.manager} size={24} />
                  <span style={{ fontSize: "13px", color: "#ccc" }}>{project.manager}</span>
                </div>
              </MetaField>
              <MetaField label="Dział">
                <span style={{ fontSize: "13px", color: "#ccc" }}>{project.department}</span>
              </MetaField>
              <MetaField label="Priorytet">
                <span style={{ fontSize: "13px", color: "#ff6b35", fontWeight: 600 }}>↑ {project.priority}</span>
              </MetaField>
              <MetaField label="Budżet">
                <span style={{ fontSize: "13px", color: "#ccc" }}>
                  {formatPLN(project.budget)}
                  <span style={{ color: "#555", fontSize: "11px" }}> (Wydano: {formatPLN(project.spent)})</span>
                </span>
              </MetaField>
              <MetaField label="Data rozpoczęcia">
                <span style={{ fontSize: "13px", color: "#ccc" }}>{formatDate(project.startDate)}</span>
              </MetaField>
              <MetaField label="Termin">
                <span style={{ fontSize: "13px", color: "#ccc" }}>{formatDate(project.dueDate)}</span>
              </MetaField>
            </div>

            {/* Budget bar */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#555" }}>Wykorzystanie budżetu</span>
                <span style={{ fontSize: "11px", color: budgetOver ? "#ff5555" : "#555", fontWeight: budgetOver ? 600 : 400 }}>
                  {budgetPct}% {budgetOver ? "— Przekroczony!" : ""}
                </span>
              </div>
              <div style={{ height: "6px", background: "#252525", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${budgetPct}%`, background: budgetOver ? "#ff5555" : budgetPct > 80 ? "#f59e0b" : "#4ade80", borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #252525" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Opis</p>
              <p style={{ fontSize: "13px", color: "#999", lineHeight: 1.7, margin: 0 }}>"{project.description}"</p>
            </div>

            {/* Deliverables */}
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #252525" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>Lista deliverables</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {project.deliverables.map((d, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#ccc" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ff6b35", flexShrink: 0 }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Activity */}
          <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "12px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Aktywność projektu</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#555" }} width="12" height="12" viewBox="0 0 15 15" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Szukaj..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "6px 10px 6px 30px", fontSize: "12px", color: "#fff", outline: "none", width: "160px" }}
                  />
                </div>
                <button type="button" style={{ display: "flex", alignItems: "center", gap: "5px", background: "#ff6b35", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Odśwież
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {filteredActivity.map((a, idx) => (
                <ActivityItem key={a.id} activity={a} isLast={idx === filteredActivity.length - 1} />
              ))}
              {filteredActivity.length === 0 && (
                <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>Brak wyników</p>
              )}
            </div>
          </div>

          {/* Files */}
          <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "12px", padding: "24px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Załączone pliki</h2>
            <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #252525", marginBottom: "16px" }}>
              {FILE_CATEGORY_TABS.map((tab, i) => (
                <button key={tab} type="button" onClick={() => setActiveFileTab(i)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, padding: "8px 14px",
                    color: activeFileTab === i ? "#fff" : "#555",
                    borderBottom: activeFileTab === i ? "2px solid #ff6b35" : "2px solid transparent",
                    transition: "all 0.2s ease", marginBottom: "-1px",
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            {visibleFiles.length === 0 ? (
              <p style={{ color: "#444", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>Brak plików w tej kategorii</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Nazwa pliku", "Typ", "Data przesłania", "Przesłał/a"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #252525" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleFiles.map((f) => (
                    <FileRow key={f.id} file={f} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Team */}
          <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Przypisany zespół</h2>
              <button type="button" style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 500, color: "#ff6b35", cursor: "pointer" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Zaproś
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px", padding: "6px 0", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Imię</span>
                <span style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Zadania</span>
                <span style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Akcja</span>
              </div>
              {project.members.map((m, idx) => (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px", alignItems: "center", padding: "10px 0", borderTop: idx > 0 ? "1px solid #222" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={m.name} size={30} />
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#ccc" }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: "10px", color: "#555" }}>{m.role}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#888", textAlign: "center" }}>{m.tasks}</span>
                  <button type="button" style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: "5px", padding: "4px 10px", fontSize: "11px", color: "#ff6b35", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                    Wiadomość
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>Zadania</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#555" }} width="11" height="11" viewBox="0 0 15 15" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Szukaj..." style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "5px 8px 5px 26px", fontSize: "11px", color: "#fff", outline: "none", width: "110px" }} />
                </div>
                <button type="button" style={{ display: "flex", alignItems: "center", gap: "4px", background: "#ff6b35", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Wszystkie
                </button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["Zadanie", "Status", "Termin", ""].map((h) => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "#444", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #252525" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.tasks.map((t, idx) => {
                  const ts = TASK_STATUS_STYLES[t.status] ?? { bg: "#252525", color: "#888" };
                  return (
                    <tr key={t.id} style={{ borderBottom: idx < project.tasks.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                      <td style={{ padding: "9px 8px", color: "#ccc", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                      <td style={{ padding: "9px 8px" }}>
                        <span style={{ background: ts.bg, color: ts.color, fontSize: "10px", fontWeight: 600, padding: "3px 7px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "9px 8px", color: "#555", whiteSpace: "nowrap", fontSize: "11px" }}>{formatDate(t.dueDate)}</td>
                      <td style={{ padding: "9px 8px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "2px", display: "flex" }} title="Edytuj">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2L11 4L4 11H2V9L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "2px", display: "flex" }} title="Usuń">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 3h11M4 3V2h5v1M2 3l.8 8a1 1 0 001 .9h5.4a1 1 0 001-.9L11 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{label}</p>
      {children}
    </div>
  );
}

function ActionButton({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        background: primary ? (hovered ? "#ff5520" : "#ff6b35") : (hovered ? "#252525" : "#1a1a1a"),
        border: primary ? "none" : "1px solid #2a2a2a",
        borderRadius: "7px", padding: "8px 14px",
        fontSize: "12px", fontWeight: 500,
        color: primary ? "#fff" : "#aaa",
        cursor: "pointer", transition: "all 0.2s ease",
      }}>
      {icon}
      {label}
    </button>
  );
}

function ActivityItem({ activity: a, isLast }: { activity: ReturnType<typeof Object.assign> & { id: string; type: string; title: string; description: string; date: string; author: string; tag?: string }; isLast: boolean }) {
  return (
    <div style={{ display: "flex", gap: "12px", padding: "14px 0", borderBottom: isLast ? "none" : "1px solid #1e1e1e" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#252525", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
        {ACTIVITY_ICONS[a.type] ?? "📌"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#fff" }}>{a.title}</p>
          <span style={{ fontSize: "11px", color: "#444", whiteSpace: "nowrap" }}>{a.date}</span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
          {a.tag && (
            <span style={{ background: "#252525", color: "#888", borderRadius: "4px", padding: "1px 7px", fontSize: "11px", marginRight: "6px" }}>
              {a.tag}
            </span>
          )}
          {a.description}{" "}
          <span style={{ color: "#ff6b35", fontWeight: 500 }}>{a.author}</span>
        </p>
      </div>
    </div>
  );
}

function FileRow({ file: f }: { file: ProjectFile }) {
  const FILE_ICONS: Record<string, string> = {
    "Figma File": "🎨", "Sketch File": "💎", "PDF": "📕", "ZIP Archive": "📦",
    "Excel": "📊", "Word": "📝", "Image": "🖼️",
  };
  return (
    <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>{FILE_ICONS[f.type] ?? "📄"}</span>
          <div>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "#ccc" }}>{f.name}</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#555" }}>{f.size}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666" }}>{f.type}</td>
      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>
        {new Date(f.uploadedAt).toLocaleDateString("pl-PL", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Avatar name={f.uploadedBy} size={22} />
          <span style={{ fontSize: "12px", color: "#888" }}>{f.uploadedBy}</span>
        </div>
      </td>
    </tr>
  );
}
