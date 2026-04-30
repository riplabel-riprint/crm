"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";
import type { AppUser } from "@/types/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | "profile"
  | "company"
  | "security"
  | "notifications"
  | "appearance"
  | "permissions"
  | "integrations"
  | "preferences";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Ico({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IC = {
  profile:       "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  company:       "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  security:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  notifications: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  appearance:    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 2v20M2 12h20",
  permissions:   "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  integrations:  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  preferences:   "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  help:          "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  signout:       "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  camera:        "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  user2:         "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG    = "bg-[#111111]";
const CARD  = "bg-[#1a1a1a]";
const INPUT = "bg-[#222222] border border-[#333] text-white placeholder-white/25 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition w-full";
const LABEL = "block text-[13px] font-medium text-white/60 mb-1.5";
const ORANGE = "#fe4e00";

// ─── Small helpers ────────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={LABEL}>{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(INPUT, "resize-none")} />;
}
function Select({ id, options, defaultValue }: { id?: string; options: string[]; defaultValue?: string }) {
  return (
    <select id={id} defaultValue={defaultValue} className={cn(INPUT, "cursor-pointer")}>
      {options.map((o) => <option key={o} className="bg-[#222]">{o}</option>)}
    </select>
  );
}
function SaveBtn({ label = "Zapisz zmiany" }: { label?: string }) {
  return (
    <button
      style={{ backgroundColor: ORANGE }}
      className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition active:scale-95"
    >
      {label}
    </button>
  );
}
function Divider() {
  return <hr className="border-white/[0.06] my-6" />;
}
function SectionHead({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="mt-0.5 text-white/30"><Ico d={icon} size={18} /></div>
      <div>
        <p className="text-[15px] font-semibold text-white">{title}</p>
        <p className="text-[13px] text-white mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean; label: string }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          on ? "bg-[#fe4e00]" : "bg-white/10"
        )}
      >
        <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform", on ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}
function Badge({ color, children }: { color: "green" | "yellow" | "blue" | "red" | "orange"; children: React.ReactNode }) {
  const cls = {
    green:  "bg-green-500/15 text-green-400",
    yellow: "bg-yellow-500/15 text-yellow-400",
    blue:   "bg-blue-500/15 text-blue-400",
    red:    "bg-red-500/15 text-red-400",
    orange: "bg-[#fe4e00]/15 text-[#fe4e00]",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", cls[color])}>{children}</span>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: AppUser }) {
  const initials = getInitials(user.name);
  const [firstName, ...rest] = user.name.trim().split(/\s+/);
  const lastName = rest.join(" ");

  return (
    <div>
      {/* Avatar row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white select-none"
              style={{ background: "linear-gradient(135deg, #ff6b6b, #fe4e00)" }}
            >
              {initials}
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-white">{user.name}</p>
            {user.email && <p className="text-sm text-white mt-0.5">{user.email}</p>}
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:border-white/20 hover:text-white/80 transition">
          <Ico d={IC.camera} size={14} />
          Zmień zdjęcie
        </button>
      </div>

      {/* Personal info */}
      <SectionHead icon={IC.user2} title="Dane osobowe" desc="Zarządzaj swoimi danymi podstawowymi." />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fname">Imię</Label>
          <Input id="fname" type="text" defaultValue={firstName} />
        </div>
        <div>
          <Label htmlFor="lname">Nazwisko</Label>
          <Input id="lname" type="text" defaultValue={lastName} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" defaultValue={user.email ?? ""} />
      </div>

      <div className="mt-4">
        <Label htmlFor="phone">Telefon</Label>
        <div className="flex gap-2">
          <div className={cn(INPUT, "w-24 shrink-0 flex items-center gap-1.5 cursor-pointer")} style={{ width: "auto", paddingRight: "12px" }}>
            <span>🇵🇱</span>
            <span className="text-white/60">+48</span>
          </div>
          <Input id="phone" type="tel" placeholder="000 000 000" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label>Kraj</Label>
          <Select options={["🇵🇱 Polska", "🇩🇪 Niemcy", "🇨🇿 Czechy", "🇬🇧 Wielka Brytania"]} defaultValue="🇵🇱 Polska" />
        </div>
        <div>
          <Label htmlFor="position">Stanowisko</Label>
          <Input
            id="position"
            type="text"
            defaultValue={user.role === "admin" ? "Administrator" : user.role === "manager" ? "Menedżer" : "Marketing"}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="bio">O mnie</Label>
        <Textarea id="bio" rows={3} placeholder="Krótki opis..." />
      </div>

      <div className="mt-6 flex justify-end">
        <SaveBtn />
      </div>
    </div>
  );
}

function CompanyTab() {
  return (
    <div>
      <SectionHead icon={IC.company} title="Dane firmy" desc="Informacje widoczne na dokumentach i fakturach." />

      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
        <div className="h-14 w-14 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/20 text-xs text-center cursor-pointer hover:border-[#fe4e00]/40 transition">
          Logo
        </div>
        <div>
          <button className="text-sm font-medium text-[#fe4e00] hover:opacity-80 transition">Prześlij logo firmy</button>
          <p className="text-xs text-white/30 mt-0.5">PNG, SVG, max 2 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Label htmlFor="cname">Nazwa firmy</Label><Input id="cname" defaultValue="Riprint Sp. z o.o." /></div>
        <div><Label htmlFor="nip">NIP</Label><Input id="nip" defaultValue="1234567890" /></div>
        <div><Label htmlFor="regon">REGON</Label><Input id="regon" defaultValue="123456789" /></div>
        <div className="col-span-2"><Label htmlFor="street">Ulica i numer</Label><Input id="street" defaultValue="ul. Drukarska 12/3" /></div>
        <div><Label htmlFor="city">Miasto</Label><Input id="city" defaultValue="Warszawa" /></div>
        <div><Label htmlFor="zip">Kod pocztowy</Label><Input id="zip" defaultValue="00-001" /></div>
        <div><Label>Kraj</Label><Select options={["🇵🇱 Polska", "🇩🇪 Niemcy", "🇨🇿 Czechy", "🇸🇰 Słowacja"]} defaultValue="🇵🇱 Polska" /></div>
        <div><Label htmlFor="cphone">Telefon firmy</Label><Input id="cphone" defaultValue="+48 22 123 45 67" /></div>
        <div className="col-span-2"><Label htmlFor="cemail">E-mail kontaktowy</Label><Input id="cemail" type="email" defaultValue="kontakt@riprint.pl" /></div>
        <div className="col-span-2"><Label htmlFor="website">Strona WWW</Label><Input id="website" defaultValue="https://riprint.pl" /></div>
      </div>

      <div className="mt-6 flex justify-end"><SaveBtn /></div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionHead icon={IC.security} title="Zmiana hasła" desc="Regularnie aktualizuj hasło, aby chronić konto." />
        <div className="space-y-3 max-w-md">
          <div><Label htmlFor="curpw">Aktualne hasło</Label><Input id="curpw" type="password" placeholder="••••••••" /></div>
          <div><Label htmlFor="newpw">Nowe hasło</Label><Input id="newpw" type="password" placeholder="••••••••" /></div>
          <div><Label htmlFor="confpw">Potwierdź nowe hasło</Label><Input id="confpw" type="password" placeholder="••••••••" /></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-green-400 font-medium shrink-0">Silne</span>
            </div>
            <p className="text-xs text-white/30">Min. 8 znaków, cyfra i znak specjalny.</p>
          </div>
          <SaveBtn label="Zaktualizuj hasło" />
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-[15px] font-semibold text-white mb-1">Weryfikacja dwuetapowa (2FA)</p>
        <p className="text-[13px] text-white/40 mb-4">Dodaj dodatkową warstwę ochrony do konta.</p>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fe4e00]/10 text-[#fe4e00]">
              <Ico d={IC.security} size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Authenticator App</p>
              <p className="text-xs text-white/40">Google Authenticator, Authy</p>
            </div>
          </div>
          <Badge color="yellow">Nieaktywne</Badge>
        </div>
        <button className="mt-3 rounded-lg border border-[#fe4e00]/30 px-4 py-2 text-sm font-medium text-[#fe4e00] hover:bg-[#fe4e00]/5 transition">
          Włącz 2FA
        </button>
      </div>

      <Divider />

      <div>
        <p className="text-[15px] font-semibold text-white mb-1">Aktywne sesje</p>
        <p className="text-[13px] text-white/40 mb-4">Zarządzaj zalogowanymi urządzeniami.</p>
        <div className="space-y-2 max-w-lg">
          {[
            { device: "Chrome · Windows 11", location: "Warszawa, PL", time: "Teraz", current: true },
            { device: "Safari · iPhone 15", location: "Kraków, PL", time: "2 godz. temu", current: false },
            { device: "Firefox · macOS", location: "Gdańsk, PL", time: "Wczoraj", current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-3">
                <div className={cn("h-2 w-2 rounded-full shrink-0", s.current ? "bg-green-400" : "bg-white/20")} />
                <div>
                  <p className="text-sm font-medium text-white">{s.device}</p>
                  <p className="text-xs text-white/35">{s.location} · {s.time}</p>
                </div>
              </div>
              {s.current
                ? <Badge color="green">Bieżąca</Badge>
                : <button className="text-xs font-medium text-red-400 hover:text-red-300 transition">Wyloguj</button>
              }
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm text-red-400 hover:text-red-300 transition">Wyloguj wszystkie inne sesje</button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const groups = [
    {
      title: "Zlecenia",
      items: [
        { label: "Nowe zlecenie", email: true, push: true, sms: false },
        { label: "Zmiana statusu zlecenia", email: true, push: true, sms: false },
        { label: "Zlecenie przeterminowane", email: true, push: false, sms: true },
      ],
    },
    {
      title: "Klienci",
      items: [
        { label: "Nowy klient", email: false, push: true, sms: false },
        { label: "Wiadomość od klienta", email: true, push: true, sms: false },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Logowanie z nowego urządzenia", email: true, push: true, sms: true },
        { label: "Aktualizacje systemu", email: true, push: false, sms: false },
        { label: "Raport tygodniowy", email: true, push: false, sms: false },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.notifications} title="Powiadomienia" desc="Wybierz, jak chcesz być informowany o zdarzeniach." />

      {groups.map((g) => (
        <div key={g.title}>
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">{g.title}</p>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-white/30">Zdarzenie</th>
                  <th className="py-2.5 px-4 text-center text-xs font-medium text-white/30 w-20">E-mail</th>
                  <th className="py-2.5 px-4 text-center text-xs font-medium text-white/30 w-20">Push</th>
                  <th className="py-2.5 px-4 text-center text-xs font-medium text-white/30 w-20">SMS</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((item) => (
                  <NotifRow key={item.label} {...item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

function NotifRow({ label, email, push, sms }: { label: string; email: boolean; push: boolean; sms: boolean }) {
  const [e, setE] = useState(email);
  const [p, setP] = useState(push);
  const [s, setS] = useState(sms);
  const pairs: [boolean, (v: boolean) => void][] = [[e, setE], [p, setP], [s, setS]];
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="py-3 px-4 text-sm text-white/70">{label}</td>
      {pairs.map(([on, set], i) => (
        <td key={i} className="py-3 px-4 text-center">
          <button
            onClick={() => set(!on)}
            className={cn("inline-flex h-5 w-5 items-center justify-center rounded transition", on ? "text-[#fe4e00]" : "text-white/20")}
          >
            {on
              ? <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}><circle cx="12" cy="12" r="9"/></svg>
            }
          </button>
        </td>
      ))}
    </tr>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [accent, setAccent] = useState("#fe4e00");
  const [density, setDensity] = useState<"compact" | "normal" | "comfortable">("normal");
  const accents = ["#fe4e00", "#3C50E0", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.appearance} title="Wygląd" desc="Dostosuj motyw i wygląd panelu." />

      <div>
        <p className={LABEL}>Motyw</p>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition",
                theme === t ? "border-[#fe4e00] bg-[#fe4e00]/5" : "border-white/10 hover:border-white/20"
              )}
            >
              <div className={cn("h-10 w-full rounded-md border border-white/10",
                t === "light" ? "bg-white" : t === "dark" ? "bg-[#111]" : "bg-gradient-to-br from-white to-[#111]"
              )} />
              <span className="text-xs font-medium text-white/60">
                {t === "light" ? "Jasny" : t === "dark" ? "Ciemny" : "System"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <p className={LABEL}>Kolor akcentu</p>
        <div className="flex gap-2.5">
          {accents.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              style={{ backgroundColor: c }}
              className={cn("h-8 w-8 rounded-full transition-transform hover:scale-110", accent === c && "ring-2 ring-offset-2 ring-offset-[#111] ring-white/40")}
            />
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <p className={LABEL}>Gęstość interfejsu</p>
        <div className="flex gap-2">
          {(["compact", "normal", "comfortable"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition",
                density === d
                  ? "border-[#fe4e00] bg-[#fe4e00]/10 text-[#fe4e00] font-medium"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              )}
            >
              {d === "compact" ? "Kompaktowy" : d === "normal" ? "Normalny" : "Wygodny"}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <Toggle defaultChecked label="Animacje interfejsu" />
        <Toggle defaultChecked label="Zaokrąglone rogi kart" />
        <Toggle label="Tryb wysokiego kontrastu" />
      </div>

      <div className="flex justify-end pt-4"><SaveBtn /></div>
    </div>
  );
}

function PermissionsTab() {
  const roles = [
    { name: "Administrator", desc: "Pełny dostęp", users: 2 },
    { name: "Menedżer", desc: "Zlecenia, klienci, raporty", users: 3 },
    { name: "Pracownik", desc: "Podgląd i edycja zleceń", users: 8 },
    { name: "Obserwator", desc: "Tylko podgląd", users: 1 },
  ];
  const members = [
    { name: "Artur Piotrowski", email: "artur@riprint.pl", role: "Administrator", avatar: "AP" },
    { name: "Marta Kowalska", email: "marta@riprint.pl", role: "Menedżer", avatar: "MK" },
    { name: "Jan Nowak", email: "jan@riprint.pl", role: "Pracownik", avatar: "JN" },
    { name: "Anna Wiśniewska", email: "anna@riprint.pl", role: "Pracownik", avatar: "AW" },
  ];

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.permissions} title="Role i uprawnienia" desc="Zarządzaj dostępem użytkowników do systemu." />

      <div className="grid grid-cols-2 gap-3">
        {roles.map((r) => (
          <div key={r.name} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{r.name}</p>
              <p className="text-xs text-white/35 mt-0.5">{r.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{r.users}</p>
              <p className="text-[11px] text-white/30">użytkowników</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Członkowie zespołu</p>
            <p className="text-xs text-white/35 mt-0.5">Zapraszaj i zarządzaj dostępem.</p>
          </div>
          <button
            style={{ backgroundColor: ORANGE }}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white hover:opacity-90 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M12 5v14M5 12h14"/></svg>
            Zaproś
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="py-2.5 px-4 text-left text-xs font-medium text-white/30">Użytkownik</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-white/30">Rola</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-white/30">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fe4e00]/15 text-[#fe4e00] text-[11px] font-bold">{m.avatar}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        <p className="text-xs text-white/30">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60 outline-none focus:border-[#fe4e00]/40 transition" defaultValue={m.role}>
                      {["Administrator","Menedżer","Pracownik","Obserwator"].map((r) => <option key={r} className="bg-[#222]">{r}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4"><Badge color="green">Aktywny</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-red-400/70 hover:text-red-400 transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: "Allegro", desc: "Synchronizuj zamówienia z Allegro", logo: "AL", connected: true },
    { name: "WooCommerce", desc: "Integracja ze sklepem WooCommerce", logo: "WC", connected: true },
    { name: "Fakturownia", desc: "Automatyczne wystawianie faktur", logo: "FK", connected: false },
    { name: "BaseLinker", desc: "Wielokanałowe zarządzanie sprzedażą", logo: "BL", connected: false },
    { name: "InPost", desc: "Etykiety i śledzenie paczek", logo: "IN", connected: true },
    { name: "Slack", desc: "Powiadomienia na kanałach Slack", logo: "SL", connected: false },
    { name: "Zapier", desc: "Automatyzacja z 5000+ aplikacjami", logo: "ZP", connected: false },
    { name: "Google Sheets", desc: "Eksport raportów do arkuszy", logo: "GS", connected: false },
  ];

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.integrations} title="Integracje" desc="Połącz Riprint z zewnętrznymi narzędziami." />

      <div className="grid grid-cols-2 gap-3">
        {integrations.map((intg) => (
          <div key={intg.name} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:border-white/10 transition">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/50">{intg.logo}</div>
              <div>
                <p className="text-sm font-medium text-white">{intg.name}</p>
                <p className="text-xs text-white/35">{intg.desc}</p>
              </div>
            </div>
            <button className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              intg.connected
                ? "border border-white/10 text-white/40 hover:border-red-500/30 hover:text-red-400"
                : "bg-[#fe4e00]/10 text-[#fe4e00] hover:bg-[#fe4e00]/20"
            )}>
              {intg.connected ? "Odłącz" : "Połącz"}
            </button>
          </div>
        ))}
      </div>

      <Divider />

      <div>
        <p className="text-[15px] font-semibold text-white mb-1">Klucze API</p>
        <p className="text-[13px] text-white/40 mb-4">Tokeny dostępu do Riprint API.</p>
        <div className="space-y-2 max-w-lg">
          {[
            { name: "Klucz produkcyjny", key: "rip_live_••••••••••••5f3a", created: "2024-01-15" },
            { name: "Klucz testowy", key: "rip_test_••••••••••••9c2b", created: "2024-03-20" },
          ].map((k) => (
            <div key={k.name} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
              <div>
                <p className="text-sm font-medium text-white">{k.name}</p>
                <p className="font-mono text-xs text-white/30 mt-0.5">{k.key}</p>
                <p className="text-xs text-white/25 mt-0.5">Utworzono: {k.created}</p>
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-medium text-[#fe4e00]/80 hover:text-[#fe4e00] transition">Kopiuj</button>
                <button className="text-xs font-medium text-red-400/60 hover:text-red-400 transition">Usuń</button>
              </div>
            </div>
          ))}
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#fe4e00]/70 hover:text-[#fe4e00] transition mt-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}><path d="M12 5v14M5 12h14"/></svg>
            Wygeneruj nowy klucz
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-6">
      <SectionHead icon={IC.preferences} title="Preferencje aplikacji" desc="Dostosuj zachowanie i domyślne ustawienia panelu." />

      <div>
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Widoki domyślne</p>
        <div className="space-y-3 max-w-sm">
          <div><Label>Strona startowa po logowaniu</Label><Select options={["Dashboard", "Zlecenia", "Klienci", "Workflow"]} defaultValue="Dashboard" /></div>
          <div><Label>Domyślny widok zleceń</Label><Select options={["Lista", "Kanban", "Tabela"]} defaultValue="Lista" /></div>
          <div><Label>Sortowanie zleceń</Label><Select options={["Data (najnowsze)", "Data (najstarsze)", "Klient (A-Z)", "Status"]} defaultValue="Data (najnowsze)" /></div>
          <div><Label>Rekordów na stronę</Label><Select options={["10", "25", "50", "100"]} defaultValue="25" /></div>
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-1">Zachowanie</p>
        <Toggle defaultChecked label="Automatycznie zapisuj wersje robocze" />
        <Toggle defaultChecked label="Potwierdzaj przed usunięciem rekordu" />
        <Toggle label="Otwieraj zlecenia w nowej karcie" />
        <Toggle defaultChecked label="Dźwięki interfejsu" />
        <Toggle defaultChecked label="Skróty klawiszowe" />
        <Toggle label="Tryb skupienia (ukryj panel boczny)" />
      </div>

      <Divider />

      <div>
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Domyślne ustawienia nadruków</p>
        <div className="space-y-3 max-w-sm">
          <div><Label>Technika druku</Label><Select options={["DTG", "Sitodruk", "Haft", "Transfer"]} defaultValue="DTG" /></div>
          <div><Label>Rozmiar podglądu</Label><Select options={["Mały (150px)", "Średni (300px)", "Duży (600px)"]} defaultValue="Średni (300px)" /></div>
          <div><Label>Format eksportu</Label><Select options={["PDF", "PNG", "SVG", "ZIP"]} defaultValue="PDF" /></div>
        </div>
      </div>

      <Divider />

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm font-semibold text-red-400 mb-1">Strefa niebezpieczna</p>
        <p className="text-xs text-red-400/50 mb-3">Akcje nieodwracalne. Wykonuj ostrożnie.</p>
        <div className="flex gap-2 flex-wrap">
          <button className="rounded-lg border border-red-500/20 px-3.5 py-2 text-xs font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition">
            Wyczyść historię aktywności
          </button>
          <button className="rounded-lg border border-red-500/20 px-3.5 py-2 text-xs font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition">
            Zresetuj ustawienia panelu
          </button>
          <button className="rounded-lg bg-red-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-600 transition">
            Usuń konto
          </button>
        </div>
      </div>

      <div className="flex justify-end"><SaveBtn /></div>
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const tabs: Tab[] = [
  { id: "profile",       label: "Profil",         icon: <Ico d={IC.profile} /> },
  { id: "company",       label: "Firma",           icon: <Ico d={IC.company} /> },
  { id: "security",      label: "Bezpieczeństwo",  icon: <Ico d={IC.security} /> },
  { id: "notifications", label: "Powiadomienia",   icon: <Ico d={IC.notifications} /> },
  { id: "appearance",    label: "Wygląd",          icon: <Ico d={IC.appearance} /> },
  { id: "permissions",   label: "Uprawnienia",     icon: <Ico d={IC.permissions} /> },
  { id: "integrations",  label: "Integracje",      icon: <Ico d={IC.integrations} /> },
  { id: "preferences",   label: "Preferencje",     icon: <Ico d={IC.preferences} /> },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const { currentUser, logout } = useUserStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const tabPanels: Record<TabId, React.ReactNode> = {
    profile:       currentUser ? <ProfileTab user={currentUser} /> : null,
    company:       <CompanyTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
    permissions:   <PermissionsTab />,
    integrations:  <IntegrationsTab />,
    preferences:   <PreferencesTab />,
  };

  return (
    <div className={cn("flex h-full", BG)}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/[0.06] py-4 px-3">
        {/* Nav */}
        <nav className="flex-1">
          <ul className="space-y-0.5">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all text-left",
                      active
                        ? "font-semibold text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                    )}
                    style={active ? { backgroundColor: `${ORANGE}22`, color: ORANGE } : {}}
                  >
                    <span style={active ? { color: ORANGE } : { color: "rgba(255,255,255,0.3)" }}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/[0.06] pt-3 space-y-0.5">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition">
            <Ico d={IC.help} />
            Pomoc i wsparcie
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition"
          >
            <Ico d={IC.signout} />
            Wyloguj się
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className={cn("rounded-2xl border border-white/[0.07] p-8 min-h-full", CARD)}>
          <h2 className="text-lg font-semibold text-white mb-6">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          {tabPanels[activeTab]}
        </div>
      </main>
    </div>
  );
}
