"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileMenuButton, MobileDrawer } from "./MobileNav";
import { SearchPopup } from "./SearchPopup";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/store/user-store";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":   "Dashboard",
  "/orders":      "Zlecenia",
  "/orders/new":  "Nowe zlecenie",
  "/clients":     "Klienci",
  "/prints/new":  "Kreator druku",
  "/workflows":   "Przepływy",
  "/services":    "Usługi",
  "/clothing":    "Odzież",
  "/settings":    "Ustawienia",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { currentUser, logout } = useUserStore();

  const label =
    PAGE_LABELS[pathname] ??
    Object.entries(PAGE_LABELS).find(([key]) => pathname.startsWith(key))?.[1] ??
    "Panel";

  const displayName = currentUser?.name || currentUser?.email || "Użytkownik";
  const initials = currentUser?.name ? getInitials(currentUser.name) : "?";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)] px-4 md:px-7 z-10">
        <div className="flex items-center">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <h1 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)" }}>{label}</h1>
        </div>
      <div className="flex items-center gap-4 text-[var(--text-muted)]">
        <SearchPopup />
        <NotificationBell />
        {dark
          ? <Moon size={17} className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={toggle} />
          : <Sun  size={17} className="cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={toggle} />
        }
        {currentUser && (
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push("/settings")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={displayName}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-[#fe4e00] flex items-center justify-center text-[11px] font-bold text-white">
                  {initials}
                </div>
              )}
              <span className="hidden sm:inline text-[13px] font-medium text-[var(--text-primary)]">{displayName}</span>
            </button>
            <button
              onClick={handleLogout}
              title="Wyloguj"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
