"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";
import {
  Home,
  Printer,
  ClipboardList,
  Users,
  GitBranch,
  Settings,
  FilePlus,
  Gift,
  CalendarDays,
  Layers,
  Package,
  LayoutGrid,
  FolderKanban,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",        label: "Home",              Icon: Home },
  { href: "/prints/new",       label: "Druk",              Icon: Printer },
  { href: "/orders",           label: "Zlecenia",          Icon: ClipboardList },
  { href: "/orders/new",       label: "Nowe zlecenie",     Icon: FilePlus },
  { href: "/clients",          label: "Klienci",           Icon: Users },
  { href: "/projects",         label: "Projekty",          Icon: FolderKanban },
  { href: "/products",         label: "Produkty",          Icon: Package },
  { href: "/modules",          label: "Moduły",            Icon: LayoutGrid },
] as const;

const bottomItems = [
  { href: "/settings", label: "Ustawienia", Icon: Settings },
] as const;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const currentUser = useUserStore((s) => s.currentUser);

  return (
    <aside className="relative hidden md:flex w-[88px] shrink-0 flex-col items-center bg-[var(--surface)] border-r border-[var(--border-subtle)] py-4">
      {/* Logo */}
      <div className="mb-5 flex items-center justify-center">
        <img
          src="https://projektowanieprzemysl.pl/wp-content/uploads/2025/12/Projekt-bez-nazwy-3.png.webp"
          alt="Projektowanie Przemyśl"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Collapse button */}


      {/* Main nav */}
      <nav className="flex flex-1 flex-col items-center gap-1 w-full px-3">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-colors duration-150",
                active
                  ? "bg-[var(--surface-hover)]"
                  : "hover:bg-[var(--surface-hover)]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  active ? "bg-[#fe4e00]/15" : ""
                )}
              >
                <Icon
                  size={20}
                  className={active ? "text-[#fe4e00]" : "text-[var(--text-muted)]"}
                />
              </span>
              <span
                className={cn(
                  "text-center text-[10px] font-medium leading-tight",
                  active ? "text-[#fe4e00]" : "text-[var(--text-muted)]"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1 w-full px-3">
      </div>
      <div className="flex flex-col items-center gap-1 w-full px-3">
        {bottomItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-colors duration-150",
                active ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  active ? "bg-[#fe4e00]/15" : ""
                )}
              >
                <Icon
                  size={20}
                  className={active ? "text-[#fe4e00]" : "text-[var(--text-muted)]"}
                />
              </span>
              <span
                className={cn(
                  "text-center text-[10px] font-medium leading-tight",
                  active ? "text-[#fe4e00]" : "text-[var(--text-muted)]"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

    </aside>
  );
}
