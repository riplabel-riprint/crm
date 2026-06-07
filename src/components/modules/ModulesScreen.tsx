"use client";

import Link from "next/link";
import { Gift, CalendarDays, Layers, GitBranch } from "lucide-react";

const modules = [
  {
    href: "/gadgets/new",
    label: "Kreator gadżetów",
    Icon: Gift,
    description: "Projektuj i konfiguruj gadżety reklamowe",
  },
  {
    href: "/impositioner",
    label: "Impozycjoner",
    Icon: Layers,
    description: "Układanie stron do druku",
  },
  {
    href: "/calendar",
    label: "Kalendarz",
    Icon: CalendarDays,
    description: "Harmonogram zleceń i terminów",
  },
  {
    href: "/services",
    label: "Workflow",
    Icon: GitBranch,
    description: "Zarządzanie etapami produkcji",
  },
];

export function ModulesScreen() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">Moduły</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Dodatkowe funkcje systemu</p>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {modules.map(({ href, label, Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 transition-all duration-150 hover:border-[#fe4e00]/40 hover:bg-[var(--surface-hover)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-hover)] group-hover:bg-[#fe4e00]/15 transition-colors duration-150">
              <Icon size={22} className="text-[var(--text-muted)] group-hover:text-[#fe4e00] transition-colors duration-150" />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-primary)] group-hover:text-[#fe4e00] transition-colors duration-150">{label}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
