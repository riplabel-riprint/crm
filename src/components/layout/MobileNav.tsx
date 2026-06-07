"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  Printer,
  ClipboardList,
  Users,
  GitBranch,
  Settings,
  Wand2,
  Shirt,
  FilePlus,
  FolderKanban,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",        label: "Overview",          Icon: Home },
  { href: "/prints/new",       label: "Kreator",           Icon: Printer },
  { href: "/kreator-nadrukow", label: "Kreator nadruków",  Icon: Wand2 },
  { href: "/clothing",         label: "Kreator odzieży",   Icon: Shirt },
  { href: "/orders",           label: "Zlecenia",          Icon: ClipboardList },
  { href: "/orders/new",       label: "Nowe zlecenie",     Icon: FilePlus },
  { href: "/clients",          label: "Klienci",           Icon: Users },
  { href: "/projects",         label: "Projekty",          Icon: FolderKanban },
  { href: "/workflows",        label: "Workflow",          Icon: GitBranch },
  { href: "/settings",         label: "Ustawienia",        Icon: Settings },
];

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors md:hidden"
      aria-label="Otwórz menu"
    >
      <Menu size={20} />
    </button>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0d0d0d] border-r border-white/[0.07] transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-3">
            <img
              src="https://projektowanieprzemysl.pl/wp-content/uploads/2025/12/Projekt-bez-nazwy-3.png.webp"
              alt="Projektowanie Przemyśl"
              className="h-9 w-auto object-contain"
            />
            <span className="text-[13px] font-semibold text-white leading-tight">
              Projektowanie<br />Przemyśl
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/orders" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150",
                  active ? "bg-[#1a1a1a]" : "hover:bg-[#1a1a1a]"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-[#fe4e00]/15" : ""
                  )}
                >
                  <Icon size={18} className={active ? "text-[#fe4e00]" : "text-white/70"} />
                </span>
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    active ? "text-[#fe4e00]" : "text-white/70"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
