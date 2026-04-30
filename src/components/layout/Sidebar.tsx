"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Printer,
  ClipboardList,
  Users,
  GitBranch,
  Settings,
  RefreshCw,
  ChevronLeft,
  Wand2,
  Shirt,
  FilePlus,
  Package,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",        label: "Overview",          Icon: Home },
  { href: "/prints/new",       label: "Kreator",           Icon: Printer },
  { href: "/clothing",         label: "Kreator odzieży",   Icon: Shirt },
  { href: "/gadgets/new",      label: "Kreator gadżetów",  Icon: Package },
  { href: "/orders",           label: "Zlecenia",          Icon: ClipboardList },
  { href: "/orders/new",       label: "Nowe zlecenie",     Icon: FilePlus },
  { href: "/clients",          label: "Klienci",           Icon: Users },
  { href: "/services",        label: "Workflow",          Icon: GitBranch },
] as const;

const bottomItems = [
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden md:flex w-[88px] shrink-0 flex-col items-center bg-[#0d0d0d] py-4">
      {/* Logo */}
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
        <RefreshCw size={22} className="text-white" />
      </div>

      {/* Collapse button */}
      <button className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-white shadow-md">
        <ChevronLeft size={14} />
      </button>

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
                  ? "bg-[#1a1a1a]"
                  : "hover:bg-[#1a1a1a]"
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
                  className={active ? "text-[#fe4e00]" : "text-white/70"}
                />
              </span>
              <span
                className={cn(
                  "text-center text-[10px] font-medium leading-tight",
                  active ? "text-[#fe4e00]" : "text-white/60"
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
                  className={active ? "text-[#fe4e00]" : "text-white/70"}
                />
              </span>
              <span
                className={cn(
                  "text-center text-[10px] font-medium leading-tight",
                  active ? "text-[#fe4e00]" : "text-white/60"
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
