"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Printer, ClipboardList, Users, Settings } from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard",  label: "Home",     Icon: Home },
  { href: "/prints/new", label: "Druk",     Icon: Printer },
  { href: "/orders",     label: "Zlecenia", Icon: ClipboardList },
  { href: "/clients",    label: "Klienci",  Icon: Users },
  { href: "/settings",   label: "Więcej",   Icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-[var(--surface)] border-t border-[var(--border-subtle)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {mobileNavItems.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-150",
              active ? "text-[#fe4e00]" : "text-[var(--text-muted)]"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                active ? "bg-[#fe4e00]/15" : ""
              )}
            >
              <Icon size={20} />
            </span>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
