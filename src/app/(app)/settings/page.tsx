"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user-store";
import {
  useSettingsStore,
  type CompanySettings,
  type AppearanceSettings,
  type PreferencesSettings,
  type NotifPrefs,
  type MemberRole,
  type Member,
} from "@/store/settings-store";
import type { AppUser } from "@/types/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | "profile"
  | "security"
  | "notifications"
  | "permissions"
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
  eye:           "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:        "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  plus:          "M12 5v14M5 12h14",
  check:         "M20 6L9 17l-5-5",
  x:             "M18 6L6 18M6 6l12 12",
  key:           "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  copy:          "M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z",
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG    = "bg-[#111111]";
const CARD  = "bg-[#1a1a1a]";
const INPUT = "bg-[#222222] border border-[#333] text-white placeholder-white/25 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition w-full";
const LABEL = "block text-[13px] font-medium text-white/60 mb-1.5";
const ORANGE = "#fe4e00";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className={LABEL}>{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT, props.className)} />;
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
        <p className="text-[13px] text-white/40 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-[#fe4e00]" : "bg-white/10"
        )}
      >
        <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
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

function SelectField({ id, value, options, onChange }: { id?: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT, "cursor-pointer")}
    >
      {options.map((o) => <option key={o} className="bg-[#222]">{o}</option>)}
    </select>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 px-4 py-3 shadow-xl text-sm text-white">
      <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16} className="text-[#fe4e00] shrink-0">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
      {message}
    </div>
  );
}

function SaveRow({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {dirty && !saving && (
          <span className="text-xs text-[#fe4e00]/80">Masz niezapisane zmiany</span>
        )}
        {onReset && dirty && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-white/30 hover:text-white/60 transition"
          >
            Anuluj
          </button>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={!dirty || saving}
        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: ORANGE }}
      >
        {saving ? "Zapisywanie…" : "Zapisz zmiany"}
      </button>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Country picker ───────────────────────────────────────────────────────────

const COUNTRIES = [
  { flag: "🇵🇱", code: "+48",  name: "Polska" },
  { flag: "🇩🇪", code: "+49",  name: "Niemcy" },
  { flag: "🇨🇿", code: "+420", name: "Czechy" },
  { flag: "🇬🇧", code: "+44",  name: "Wielka Brytania" },
  { flag: "🇺🇸", code: "+1",   name: "USA" },
  { flag: "🇫🇷", code: "+33",  name: "Francja" },
  { flag: "🇸🇰", code: "+421", name: "Słowacja" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFirstName(v: string) {
  if (!v.trim()) return "Imię jest wymagane";
  if (v.trim().length < 2 || v.trim().length > 50) return "Imię musi zawierać 2–50 znaków";
  if (!/^[\p{L}\s]+$/u.test(v)) return "Imię może zawierać tylko litery i spacje";
  return null;
}
function validateLastName(v: string) {
  if (v.length > 50) return "Nazwisko może mieć maksymalnie 50 znaków";
  if (v && !/^[\p{L}\s]+$/u.test(v)) return "Nazwisko może zawierać tylko litery i spacje";
  return null;
}
function validateEmail(v: string) {
  if (!v.trim()) return "E-mail jest wymagany";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Nieprawidłowy format emaila";
  return null;
}
function validatePhone(v: string) {
  if (!v.trim()) return "Numer telefonu jest wymagany";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "Nieprawidłowy numer telefonu";
  return null;
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: AppUser }) {
  const { updateProfile } = useUserStore();
  const [firstName, ...nameParts] = user.name.trim().split(/\s+/);
  const initialLastName = nameParts.join(" ");

  const [form, setForm] = useState({
    firstName: firstName ?? "",
    lastName:  initialLastName,
    email:     user.email ?? "",
  });

  const saved = useRef({ ...form });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user.avatar ?? null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState(false);

  const validators: Record<string, (v: string) => string | null> = {
    firstName: validateFirstName,
    lastName:  validateLastName,
    email:     validateEmail,
  };

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validators[name]?.(value) ?? null }));
    }
  }

  function handleBlur(name: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validators[name]?.(form[name as keyof typeof form]) ?? null }));
  }

  const isDirty = avatarDirty || (Object.keys(form) as Array<keyof typeof form>).some(
    (k) => form[k] !== saved.current[k as keyof typeof saved.current]
  );

  function applyAvatar(file: File) {
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, avatar: "Dozwolone formaty: JPG, PNG, GIF" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Maksymalny rozmiar pliku: 5 MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, avatar: null }));
    setAvatarSrc(URL.createObjectURL(file));
    setAvatarDirty(true);
  }

  async function handleSave() {
    const allTouched = Object.fromEntries(Object.keys(validators).map((k) => [k, true]));
    setTouched(allTouched);
    const allErrors = Object.fromEntries(
      Object.keys(validators).map((k) => [k, validators[k](form[k as keyof typeof form])])
    );
    setErrors(allErrors);
    if (Object.values(allErrors).some(Boolean)) return;

    const emailChanged = form.email !== saved.current.email;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const name = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      updateProfile({ name, email: form.email, ...(avatarSrc !== null ? { avatar: avatarSrc } : {}) });
      saved.current = { ...form };
      setAvatarDirty(false);
      if (emailChanged) {
        setEmailModal(true);
      } else {
        setToast("Profil został zaktualizowany");
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const initials = getInitials(user.name);

  const dirtyInput = (name: string) =>
    cn(INPUT,
      form[name as keyof typeof form] !== saved.current[name as keyof typeof saved.current]
        ? "border-[#fe4e00]/50 bg-[#fe4e00]/[0.04]"
        : ""
    );

  return (
    <div>
      <SectionHead icon={IC.user2} title="Dane osobowe" desc="Zarządzaj swoimi danymi podstawowymi." />

      <div
        className={cn(
          "flex items-center gap-5 mb-8 p-4 rounded-xl border-2 border-dashed transition",
          isDragging ? "border-[#fe4e00]/60 bg-[#fe4e00]/5" : "border-white/10 bg-white/[0.02]"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) applyAvatar(f); }}
      >
        <div className="relative shrink-0">
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-[#fe4e00]/40" />
            : (
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white select-none ring-2 ring-white/10"
                style={{ background: "linear-gradient(135deg, #ff6b6b, #fe4e00)" }}
              >
                {initials}
              </div>
            )
          }
          {avatarDirty && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#fe4e00] ring-2 ring-[#111]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">
            {isDragging ? "Upuść zdjęcie tutaj…" : "Przeciągnij zdjęcie lub kliknij, aby wybrać"}
          </p>
          <p className="text-xs text-white/35 mt-0.5">JPG, PNG, GIF · maks. 5 MB</p>
          {errors.avatar && <p className="text-xs text-red-400 mt-1">{errors.avatar}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) applyAvatar(f); }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/60 hover:border-white/20 hover:text-white/80 transition"
          >
            <Ico d={IC.camera} size={14} />
            Zmień zdjęcie
          </button>
          {avatarDirty && (
            <button
              type="button"
              onClick={() => { setAvatarSrc(null); setAvatarDirty(false); }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/40 hover:text-white/70 transition"
            >
              Anuluj
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fname">Imię <span className="text-[#fe4e00]">*</span></Label>
          <input id="fname" type="text" value={form.firstName} placeholder="Wprowadź swoje imię" disabled={saving}
            onChange={(e) => updateField("firstName", e.target.value)} onBlur={() => handleBlur("firstName")}
            className={dirtyInput("firstName")} />
          {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor="lname">Nazwisko</Label>
          <input id="lname" type="text" value={form.lastName} placeholder="Wprowadź swoje nazwisko" disabled={saving}
            onChange={(e) => updateField("lastName", e.target.value)} onBlur={() => handleBlur("lastName")}
            className={dirtyInput("lastName")} />
          {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor="email" className={cn(LABEL, "mb-0")}>E-mail <span className="text-[#fe4e00]">*</span></label>
          {form.email !== saved.current.email && (
            <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#fe4e00]/15 text-[#fe4e00]">Zmieniono</span>
          )}
        </div>
        <input id="email" type="email" value={form.email} placeholder="nazwa@domena.pl" disabled={saving}
          onChange={(e) => updateField("email", e.target.value)} onBlur={() => handleBlur("email")}
          className={dirtyInput("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        {form.email !== saved.current.email && !errors.email && (
          <p className="mt-1 text-xs text-white/35">Po zapisaniu zostanie wysłany link weryfikacyjny na nowy adres.</p>
        )}
      </div>

      <SaveRow dirty={isDirty} saving={saving} onSave={handleSave}
        onReset={() => { setForm({ ...saved.current }); setAvatarSrc(null); setAvatarDirty(false); setErrors({}); }} />

      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fe4e00]/10 text-[#fe4e00] mb-4">
              <Ico d={IC.notifications} size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Weryfikacja nowego adresu e-mail</h3>
            <p className="text-sm text-white/50 mb-4">
              Na adres <span className="text-white/80 font-medium">{form.email}</span> została wysłana wiadomość weryfikacyjna. Link jest ważny przez 24 h.
            </p>
            <button onClick={() => setEmailModal(false)}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: ORANGE }}>
              Rozumiem
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── CompanyTab ───────────────────────────────────────────────────────────────

function CompanyTab() {
  const { company, setCompany } = useSettingsStore();
  const [form, setForm] = useState<CompanySettings>({ ...company });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(company);

  function update(field: keyof CompanySettings, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleLogoChange(file: File) {
    if (file.size > 2 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, logoUrl: url }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setCompany(form);
    setSaving(false);
    setToast("Dane firmy zostały zapisane");
  }

  function handleReset() {
    setForm({ ...company });
  }

  const f = (field: keyof CompanySettings) =>
    cn(INPUT, form[field] !== company[field] ? "border-[#fe4e00]/50 bg-[#fe4e00]/[0.04]" : "");

  return (
    <div>
      <SectionHead icon={IC.company} title="Dane firmy" desc="Informacje widoczne na dokumentach i fakturach." />

      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
        {form.logoUrl
          ? <img src={form.logoUrl} alt="logo" className="h-14 w-14 rounded-xl object-contain ring-1 ring-white/10" />
          : (
            <div className="h-14 w-14 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/20 text-xs text-center cursor-pointer hover:border-[#fe4e00]/40 transition"
              onClick={() => fileInputRef.current?.click()}>
              Logo
            </div>
          )
        }
        <div>
          <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoChange(f); }} />
          <button onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-[#fe4e00] hover:opacity-80 transition">
            {form.logoUrl ? "Zmień logo" : "Prześlij logo firmy"}
          </button>
          <p className="text-xs text-white/30 mt-0.5">PNG, SVG, max 2 MB</p>
          {form.logoUrl && (
            <button onClick={() => setForm((p) => ({ ...p, logoUrl: null }))}
              className="text-xs text-red-400/60 hover:text-red-400 transition mt-0.5 block">
              Usuń logo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="cname">Nazwa firmy</Label>
          <input id="cname" className={f("name")} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="nip">NIP</Label>
          <input id="nip" className={f("nip")} value={form.nip} onChange={(e) => update("nip", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="regon">REGON</Label>
          <input id="regon" className={f("regon")} value={form.regon} onChange={(e) => update("regon", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="street">Ulica i numer</Label>
          <input id="street" className={f("street")} value={form.street} onChange={(e) => update("street", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">Miasto</Label>
          <input id="city" className={f("city")} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="zip">Kod pocztowy</Label>
          <input id="zip" className={f("zip")} value={form.zip} onChange={(e) => update("zip", e.target.value)} />
        </div>
        <div>
          <Label>Kraj</Label>
          <SelectField
            value={form.country}
            options={["🇵🇱 Polska", "🇩🇪 Niemcy", "🇨🇿 Czechy", "🇸🇰 Słowacja"]}
            onChange={(v) => update("country", v)}
          />
        </div>
        <div>
          <Label htmlFor="cphone">Telefon firmy</Label>
          <input id="cphone" className={f("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="cemail">E-mail kontaktowy</Label>
          <input id="cemail" type="email" className={f("email")} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="website">Strona WWW</Label>
          <input id="website" className={f("website")} value={form.website} onChange={(e) => update("website", e.target.value)} />
        </div>
      </div>

      <SaveRow dirty={isDirty} saving={saving} onSave={handleSave} onReset={handleReset} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── SecurityTab ──────────────────────────────────────────────────────────────

// ─── 2FA helpers ─────────────────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateSecret(len = 32): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => BASE32_CHARS[b % 32]).join("");
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const a = Math.floor(10000000 + Math.random() * 90000000).toString();
    return a.slice(0, 4) + "-" + a.slice(4);
  });
}

function QRCodeSVG({ secret, email }: { secret: string; email: string }) {
  const uri = `otpauth://totp/Riprint:${encodeURIComponent(email)}?secret=${secret}&issuer=Riprint`;
  const size = 21;
  const cells: boolean[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      // Fixed-position patterns (corners)
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      if (inFinder) {
        const lr = r >= size - 7 ? r - (size - 7) : r;
        const lc = c >= size - 7 ? c - (size - 7) : c;
        return (lr === 0 || lr === 6 || lc === 0 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      }
      // Timing patterns
      if (r === 6 || c === 6) return (r + c) % 2 === 0;
      // Data area — deterministic from secret
      const idx = r * size + c;
      const ch = uri.charCodeAt(idx % uri.length);
      return (ch ^ (r * 3 + c * 7)) % 3 !== 0;
    })
  );

  return (
    <svg viewBox={`0 0 ${size + 2} ${size + 2}`} width={160} height={160} xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
      <rect width={size + 2} height={size + 2} fill="white" />
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width={1} height={1} fill="black" /> : null
        )
      )}
    </svg>
  );
}

// ─── SecurityTab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const { twoFAEnabled, setTwoFA } = useSettingsStore();
  const currentUser = useUserStore((s) => s.currentUser);
  const userEmail = currentUser?.email ?? "user@riprint.pl";

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [pwErrors, setPwErrors] = useState<Record<string, string | null>>({});
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 2FA setup state
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "verify" | "backup" | "disable">("idle");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disableInput, setDisableInput] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  function startSetup() {
    setSecret(generateSecret());
    setBackupCodes(generateBackupCodes());
    setOtpInput("");
    setOtpError(null);
    setSetupStep("qr");
  }

  function cancelSetup() {
    setSetupStep("idle");
    setOtpInput("");
    setOtpError(null);
  }

  async function handleVerifyOtp() {
    if (!/^\d{6}$/.test(otpInput)) {
      setOtpError("Kod musi zawierać dokładnie 6 cyfr");
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 800));
    setVerifying(false);
    setSetupStep("backup");
  }

  function handleFinish() {
    setTwoFA(true);
    setSetupStep("idle");
    setToast("Weryfikacja dwuetapowa została włączona");
  }

  async function handleDisable() {
    if (!/^\d{6}$/.test(disableInput) && !/^\d{4}-\d{4}$/.test(disableInput)) {
      setDisableError("Wprowadź 6-cyfrowy kod lub kod zapasowy");
      return;
    }
    setDisabling(true);
    await new Promise((r) => setTimeout(r, 700));
    setDisabling(false);
    setTwoFA(false);
    setSetupStep("idle");
    setDisableInput("");
    setDisableError(null);
    setToast("Weryfikacja dwuetapowa została wyłączona");
  }

  function pwStrength(pw: string): { label: string; color: string; width: string } {
    if (!pw) return { label: "", color: "bg-white/10", width: "w-0" };
    let score = 0;
    if (pw.length >= 8)   score++;
    if (pw.length >= 12)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: "Słabe",   color: "bg-red-500",    width: "w-1/4" };
    if (score <= 3) return { label: "Średnie", color: "bg-yellow-500", width: "w-2/4" };
    if (score <= 4) return { label: "Silne",   color: "bg-green-500",  width: "w-3/4" };
    return              { label: "Bardzo silne", color: "bg-green-400", width: "w-full" };
  }

  async function handleChangePw() {
    const errs: Record<string, string | null> = {};
    if (!pwForm.current) errs.current = "Wymagane";
    if (!pwForm.next || pwForm.next.length < 8) errs.next = "Min. 8 znaków";
    if (pwForm.next !== pwForm.confirm) errs.confirm = "Hasła się nie zgadzają";
    setPwErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSavingPw(true);
    await new Promise((r) => setTimeout(r, 700));
    setSavingPw(false);
    setPwForm({ current: "", next: "", confirm: "" });
    setToast("Hasło zostało zaktualizowane");
  }

  const strength = pwStrength(pwForm.next);

  const secretFormatted = secret.match(/.{1,4}/g)?.join(" ") ?? "";

  return (
    <div className="space-y-6">
      {/* Password */}
      <div>
        <SectionHead icon={IC.security} title="Zmiana hasła" desc="Regularnie aktualizuj hasło, aby chronić konto." />
        <div className="space-y-3 max-w-md">
          {(["current", "next", "confirm"] as const).map((key) => {
            const labels = { current: "Aktualne hasło", next: "Nowe hasło", confirm: "Potwierdź nowe hasło" };
            const ids    = { current: "curpw", next: "newpw", confirm: "confpw" };
            return (
              <div key={key}>
                <Label htmlFor={ids[key]}>{labels[key]}</Label>
                <div className="relative">
                  <input
                    id={ids[key]}
                    type={showPw[key] ? "text" : "password"}
                    value={pwForm[key]}
                    placeholder="••••••••"
                    onChange={(e) => { setPwForm((p) => ({ ...p, [key]: e.target.value })); setPwErrors((p) => ({ ...p, [key]: null })); }}
                    className={cn(INPUT, "pr-10", pwErrors[key] ? "border-red-500/50" : "")}
                  />
                  <button type="button" onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                    <Ico d={showPw[key] ? IC.eyeOff : IC.eye} size={15} />
                  </button>
                </div>
                {pwErrors[key] && <p className="mt-1 text-xs text-red-400">{pwErrors[key]}</p>}
              </div>
            );
          })}

          {pwForm.next && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", strength.color, strength.width)} />
                </div>
                <span className="text-xs font-medium text-white/50 shrink-0">{strength.label}</span>
              </div>
              <p className="text-xs text-white/30">Min. 8 znaków, cyfra i znak specjalny.</p>
            </div>
          )}

          <button onClick={handleChangePw} disabled={savingPw}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: ORANGE }}>
            {savingPw ? "Aktualizowanie…" : "Zaktualizuj hasło"}
          </button>
        </div>
      </div>

      <Divider />

      {/* 2FA */}
      <div>
        <SectionHead icon={IC.key} title="Weryfikacja dwuetapowa (2FA)" desc="Dodaj dodatkową warstwę ochrony — aplikacja generuje jednorazowy kod przy każdym logowaniu." />

        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 max-w-lg">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold", twoFAEnabled ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/30")}>
              {twoFAEnabled
                ? <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                : <Ico d={IC.key} size={18} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Aplikacja Authenticator</p>
              <p className="text-xs text-white/40 mt-0.5">Google Authenticator · Authy · Microsoft Authenticator</p>
            </div>
          </div>
          <Badge color={twoFAEnabled ? "green" : "yellow"}>{twoFAEnabled ? "Aktywne" : "Nieaktywne"}</Badge>
        </div>

        <div className="mt-3">
          {twoFAEnabled ? (
            <button
              onClick={() => { setDisableInput(""); setDisableError(null); setSetupStep("disable"); }}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/5 transition">
              Wyłącz 2FA
            </button>
          ) : (
            <button
              onClick={startSetup}
              className="rounded-lg border border-[#fe4e00]/30 px-4 py-2 text-sm font-medium text-[#fe4e00] hover:bg-[#fe4e00]/5 transition">
              Włącz 2FA
            </button>
          )}
        </div>
      </div>

      {/* ── Setup: Step 1 — QR ── */}
      {setupStep === "qr" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe4e00]/10 text-[#fe4e00]">
                  <Ico d={IC.key} size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Krok 1 z 2 — Skanuj kod QR</p>
                  <p className="text-xs text-white/35">lub wprowadź klucz ręcznie</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-white/60">
                Otwórz aplikację <span className="text-white/80 font-medium">Google Authenticator</span>, <span className="text-white/80 font-medium">Authy</span> lub inną zgodną z TOTP i zeskanuj poniższy kod.
              </p>

              <div className="flex justify-center">
                <div className="rounded-xl border border-white/10 bg-white p-3 inline-block">
                  <QRCodeSVG secret={secret} email={userEmail} />
                </div>
              </div>

              <div>
                <p className="text-xs text-white/35 mb-1.5">Klucz do ręcznego wprowadzenia</p>
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                  <span className="flex-1 font-mono text-xs text-white/70 tracking-widest select-all">{secretFormatted}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(secret).catch(() => {}); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }}
                    className={cn("shrink-0 text-xs font-medium transition", copiedSecret ? "text-green-400" : "text-[#fe4e00]/70 hover:text-[#fe4e00]")}>
                    {copiedSecret ? "Skopiowano" : "Kopiuj"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setSetupStep("verify")}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ backgroundColor: ORANGE }}>
                Dalej — Weryfikacja
              </button>
              <button onClick={cancelSetup}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Setup: Step 2 — Verify OTP ── */}
      {setupStep === "verify" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe4e00]/10 text-[#fe4e00]">
                  <Ico d={IC.key} size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Krok 2 z 2 — Weryfikacja</p>
                  <p className="text-xs text-white/35">Potwierdź, że aplikacja działa poprawnie</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/60">
                Wprowadź <span className="text-white/80 font-medium">6-cyfrowy kod</span> wygenerowany przez aplikację Authenticator.
              </p>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }}
                  className={cn(INPUT, "text-center text-2xl font-mono tracking-[0.4em] py-3", otpError ? "border-red-500/50" : "")}
                  autoFocus
                />
                {otpError && <p className="mt-1.5 text-xs text-red-400">{otpError}</p>}
              </div>
              <p className="text-xs text-white/25">Kod jest ważny przez 30 sekund. Jeśli wygasł, poczekaj na nowy.</p>
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button onClick={handleVerifyOtp} disabled={verifying || otpInput.length !== 6}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40"
                style={{ backgroundColor: ORANGE }}>
                {verifying ? "Weryfikowanie…" : "Potwierdź"}
              </button>
              <button onClick={() => setSetupStep("qr")}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition">
                Wróć
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Setup: Step 3 — Backup codes ── */}
      {setupStep === "backup" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 text-green-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Kod zweryfikowany — zapisz kody zapasowe</p>
                  <p className="text-xs text-white/35">Każdy kod można użyć tylko raz</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/60">
                Zachowaj te kody w bezpiecznym miejscu. Możesz ich użyć do logowania, gdy nie masz dostępu do aplikacji Authenticator.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                {backupCodes.map((code) => (
                  <span key={code} className="font-mono text-sm text-white/80 text-center tracking-widest py-1">{code}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")).catch(() => {}); setCopiedCodes(true); setTimeout(() => setCopiedCodes(false), 2000); }}
                  className={cn("flex items-center gap-1.5 text-xs font-medium transition", copiedCodes ? "text-green-400" : "text-[#fe4e00]/70 hover:text-[#fe4e00]")}>
                  <Ico d={copiedCodes ? IC.check : IC.copy} size={13} />
                  {copiedCodes ? "Skopiowano" : "Kopiuj kody"}
                </button>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button onClick={handleFinish}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ backgroundColor: ORANGE }}>
                Zakończ konfigurację
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disable 2FA — confirm ── */}
      {setupStep === "disable" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#161616] shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white">Wyłącz weryfikację dwuetapową</p>
              <p className="text-xs text-white/35 mt-0.5">Potwierdź tożsamość przed wyłączeniem 2FA</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/60">
                Wprowadź aktualny <span className="text-white/80 font-medium">6-cyfrowy kod</span> z aplikacji Authenticator lub jeden z kodów zapasowych.
              </p>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Kod z aplikacji lub kod zapasowy"
                  value={disableInput}
                  onChange={(e) => { setDisableInput(e.target.value); setDisableError(null); }}
                  className={cn(INPUT, disableError ? "border-red-500/50" : "")}
                  autoFocus
                />
                {disableError && <p className="mt-1.5 text-xs text-red-400">{disableError}</p>}
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={handleDisable} disabled={disabling || !disableInput.trim()}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-40">
                {disabling ? "Wyłączanie…" : "Wyłącz 2FA"}
              </button>
              <button onClick={() => setSetupStep("idle")}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── NotificationsTab ─────────────────────────────────────────────────────────

const NOTIF_GROUPS = [
  {
    title: "Zlecenia",
    items: [
      { id: "nowe-zlecenie",            label: "Nowe zlecenie" },
      { id: "zmiana-statusu",           label: "Zmiana statusu zlecenia" },
      { id: "zlecenie-przeterminowane", label: "Zlecenie przeterminowane" },
    ],
  },
  {
    title: "Klienci",
    items: [
      { id: "nowy-klient",          label: "Nowy klient" },
      { id: "wiadomosc-od-klienta", label: "Wiadomość od klienta" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "logowanie-nowe-urzadzenie", label: "Logowanie z nowego urządzenia" },
      { id: "aktualizacje-systemu",      label: "Aktualizacje systemu" },
      { id: "raport-tygodniowy",         label: "Raport tygodniowy" },
    ],
  },
];

function NotificationsTab() {
  const { notifPrefs, setNotifPrefs } = useSettingsStore();
  const [prefs, setPrefs] = useState<NotifPrefs>({ ...notifPrefs });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = JSON.stringify(prefs) !== JSON.stringify(notifPrefs);

  function toggle(id: string, channel: "email" | "push") {
    setPrefs((prev) => ({ ...prev, [id]: { ...prev[id], [channel]: !prev[id][channel] } }));
    setError(null);
  }

  async function handleSave() {
    const sec = prefs["logowanie-nowe-urzadzenie"];
    if (!sec.email && !sec.push) {
      setError("Zdarzenie bezpieczeństwa 'Logowanie z nowego urządzenia' wymaga przynajmniej jednego aktywnego kanału.");
      return;
    }
    setError(null);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setNotifPrefs(prefs);
    setSaving(false);
    setToast("Preferencje powiadomień zaktualizowane");
  }

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.notifications} title="Powiadomienia" desc="Wybierz, jak chcesz być informowany o zdarzeniach." />

      {NOTIF_GROUPS.map((g) => (
        <div key={g.title}>
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">{g.title}</p>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-white/30">Zdarzenie</th>
                  <th className="py-2.5 px-4 text-center text-xs font-medium text-white/30 w-24">E-mail</th>
                  <th className="py-2.5 px-4 text-center text-xs font-medium text-white/30 w-24">Push</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 px-4 text-sm text-white/70">{item.label}</td>
                    {(["email", "push"] as const).map((ch) => (
                      <td key={ch} className="py-3 px-4 text-center">
                        <button onClick={() => toggle(item.id, ch)}
                          className={cn("inline-flex h-5 w-5 items-center justify-center rounded transition", prefs[item.id][ch] ? "text-[#fe4e00]" : "text-white/20")}>
                          {prefs[item.id][ch]
                            ? <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}><circle cx="12" cy="12" r="9"/></svg>
                          }
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <SaveRow dirty={isDirty} saving={saving} onSave={handleSave}
        onReset={() => setPrefs({ ...notifPrefs })} />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── AppearanceTab ────────────────────────────────────────────────────────────

function AppearanceTab() {
  const { appearance, setAppearance } = useSettingsStore();
  const [form, setForm] = useState<AppearanceSettings>({ ...appearance });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(appearance);

  const update = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setAppearance(form);
    setSaving(false);
    setToast("Ustawienia wyglądu zapisane");
  }

  const accents = ["#fe4e00", "#3C50E0", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.appearance} title="Wygląd" desc="Dostosuj motyw i wygląd panelu." />

      <div>
        <p className="block text-[13px] font-medium text-white/60 mb-3">Motyw</p>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {(["light", "dark", "system"] as const).map((t) => (
            <button key={t} onClick={() => update("theme", t)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition",
                form.theme === t ? "border-[#fe4e00] bg-[#fe4e00]/5" : "border-white/10 hover:border-white/20"
              )}>
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
        <p className="block text-[13px] font-medium text-white/60 mb-3">Kolor akcentu</p>
        <div className="flex gap-2.5">
          {accents.map((c) => (
            <button key={c} onClick={() => update("accent", c)}
              style={{ backgroundColor: c }}
              className={cn("h-8 w-8 rounded-full transition-transform hover:scale-110",
                form.accent === c && "ring-2 ring-offset-2 ring-offset-[#111] ring-white/40")} />
          ))}
        </div>
        {form.accent !== appearance.accent && (
          <p className="mt-2 text-xs text-[#fe4e00]/70">Kolor zostanie zastosowany po zapisaniu.</p>
        )}
      </div>

      <Divider />

      <div>
        <p className="block text-[13px] font-medium text-white/60 mb-3">Gęstość interfejsu</p>
        <div className="flex gap-2">
          {(["compact", "normal", "comfortable"] as const).map((d) => (
            <button key={d} onClick={() => update("density", d)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition",
                form.density === d
                  ? "border-[#fe4e00] bg-[#fe4e00]/10 text-[#fe4e00] font-medium"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              )}>
              {d === "compact" ? "Kompaktowy" : d === "normal" ? "Normalny" : "Wygodny"}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <Toggle checked={form.animations}   onChange={(v) => update("animations",   v)} label="Animacje interfejsu" />
        <Toggle checked={form.roundedCards} onChange={(v) => update("roundedCards", v)} label="Zaokrąglone rogi kart" />
        <Toggle checked={form.highContrast} onChange={(v) => update("highContrast", v)} label="Tryb wysokiego kontrastu" />
      </div>

      <SaveRow dirty={isDirty} saving={saving} onSave={handleSave}
        onReset={() => setForm({ ...appearance })} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── PermissionsTab ───────────────────────────────────────────────────────────

const USER_ROLE_MAP: Record<string, MemberRole> = {
  admin:     "Administrator",
  manager:   "Menedżer",
  marketing: "Pracownik",
};

function PermissionsTab() {
  const { members, setMemberRole, removeMember, addMember, syncMember } = useSettingsStore();
  const currentUser = useUserStore((s) => s.currentUser);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const initials = currentUser.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    syncMember({
      id:     currentUser.id,
      name:   currentUser.name,
      email:  currentUser.email ?? "",
      role:   USER_ROLE_MAP[currentUser.role] ?? "Administrator",
      avatar: initials,
      status: "active",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.role]);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "Pracownik" as MemberRole });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const roleCounts: Record<string, number> = {};
  for (const m of members) roleCounts[m.role] = (roleCounts[m.role] ?? 0) + 1;

  const roles = [
    { name: "Administrator", desc: "Pełny dostęp" },
    { name: "Menedżer",      desc: "Zlecenia, klienci, raporty" },
    { name: "Pracownik",     desc: "Podgląd i edycja zleceń" },
    { name: "Obserwator",    desc: "Tylko podgląd" },
  ];

  function handleInvite() {
    if (!inviteForm.name.trim()) { setInviteError("Imię i nazwisko jest wymagane"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) { setInviteError("Nieprawidłowy e-mail"); return; }
    if (members.find((m) => m.email === inviteForm.email)) { setInviteError("Ten użytkownik już istnieje"); return; }
    setInviteError(null);
    const initials = inviteForm.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    addMember({ name: inviteForm.name, email: inviteForm.email, role: inviteForm.role, avatar: initials, status: "invited" });
    setInviteModal(false);
    setInviteForm({ name: "", email: "", role: "Pracownik" });
    setToast(`Zaproszenie wysłano do ${inviteForm.name}`);
  }

  function handleRemove(email: string) {
    removeMember(email);
    setConfirmRemove(null);
    setToast("Użytkownik został usunięty");
  }

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
              <p className="text-xl font-bold text-white">{roleCounts[r.name] ?? 0}</p>
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
            <p className="text-xs text-white/35 mt-0.5">{members.length} osób w systemie</p>
          </div>
          <button onClick={() => setInviteModal(true)}
            style={{ backgroundColor: ORANGE }}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white hover:opacity-90 transition">
            <Ico d={IC.plus} size={13} />
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
              {members.map((m) => {
                const isMe = m.id === currentUser?.id || m.email === currentUser?.email;
                return (
                <tr key={m.email} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fe4e00]/15 text-[#fe4e00] text-[11px] font-bold shrink-0">{m.avatar}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white">{m.name}</p>
                          {isMe && <span className="text-[10px] font-medium text-[#fe4e00]/70 bg-[#fe4e00]/10 rounded-full px-1.5 py-0.5">Ty</span>}
                        </div>
                        <p className="text-xs text-white/30">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60 outline-none focus:border-[#fe4e00]/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      value={m.role}
                      disabled={isMe}
                      onChange={(e) => { setMemberRole(m.email, e.target.value as MemberRole); setToast(`Rola ${m.name} zaktualizowana`); }}
                    >
                      {["Administrator","Menedżer","Pracownik","Obserwator"].map((r) => <option key={r} className="bg-[#222]">{r}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <Badge color={m.status === "active" ? "green" : "yellow"}>
                      {m.status === "active" ? "Aktywny" : "Zaproszony"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!isMe && (
                      <button onClick={() => setConfirmRemove(m.email)}
                        className="text-xs text-red-400/70 hover:text-red-400 transition">Usuń</button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Zaproś użytkownika</h3>
            <div className="space-y-3">
              <div>
                <Label>Imię i nazwisko</Label>
                <input className={INPUT} placeholder="Jan Kowalski" value={inviteForm.name}
                  onChange={(e) => { setInviteForm((p) => ({ ...p, name: e.target.value })); setInviteError(null); }} />
              </div>
              <div>
                <Label>Adres e-mail</Label>
                <input type="email" className={INPUT} placeholder="jan@firma.pl" value={inviteForm.email}
                  onChange={(e) => { setInviteForm((p) => ({ ...p, email: e.target.value })); setInviteError(null); }} />
              </div>
              <div>
                <Label>Rola</Label>
                <select className={cn(INPUT, "cursor-pointer")} value={inviteForm.role}
                  onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as MemberRole }))}>
                  {["Administrator","Menedżer","Pracownik","Obserwator"].map((r) => <option key={r} className="bg-[#222]">{r}</option>)}
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleInvite}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ backgroundColor: ORANGE }}>
                Wyślij zaproszenie
              </button>
              <button onClick={() => { setInviteModal(false); setInviteError(null); setInviteForm({ name: "", email: "", role: "Pracownik" }); }}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Usunąć użytkownika?</h3>
            <p className="text-sm text-white/50 mb-4">
              {members.find((m) => m.email === confirmRemove)?.name} straci dostęp do systemu.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleRemove(confirmRemove)}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">
                Usuń
              </button>
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white/50 border border-white/10 hover:border-white/20 transition">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── PreferencesTab ───────────────────────────────────────────────────────────

function PreferencesTab() {
  const { preferences, setPreferences } = useSettingsStore();
  const [form, setForm] = useState<PreferencesSettings>({ ...preferences });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(preferences);

  const update = <K extends keyof PreferencesSettings>(key: K, value: PreferencesSettings[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setPreferences(form);
    setSaving(false);
    setToast("Preferencje zostały zapisane");
  }

  return (
    <div className="space-y-6">
      <SectionHead icon={IC.preferences} title="Preferencje aplikacji" desc="Dostosuj zachowanie i domyślne ustawienia panelu." />

      <div>
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Widoki domyślne</p>
        <div className="space-y-3 max-w-sm">
          <div>
            <Label>Strona startowa po logowaniu</Label>
            <SelectField value={form.startPage} options={["Dashboard", "Zlecenia", "Klienci", "Workflow"]} onChange={(v) => update("startPage", v)} />
          </div>
          <div>
            <Label>Domyślny widok zleceń</Label>
            <SelectField value={form.ordersView} options={["Lista", "Kanban", "Tabela"]} onChange={(v) => update("ordersView", v)} />
          </div>
          <div>
            <Label>Sortowanie zleceń</Label>
            <SelectField value={form.orderSort} options={["Data (najnowsze)", "Data (najstarsze)", "Klient (A-Z)", "Status"]} onChange={(v) => update("orderSort", v)} />
          </div>
          <div>
            <Label>Rekordów na stronę</Label>
            <SelectField value={form.recordsPerPage} options={["10", "25", "50", "100"]} onChange={(v) => update("recordsPerPage", v)} />
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-1">Zachowanie</p>
        <Toggle checked={form.autosaveDrafts}    onChange={(v) => update("autosaveDrafts", v)}    label="Automatycznie zapisuj wersje robocze" />
        <Toggle checked={form.confirmDelete}     onChange={(v) => update("confirmDelete", v)}     label="Potwierdzaj przed usunięciem rekordu" />
        <Toggle checked={form.openInNewTab}      onChange={(v) => update("openInNewTab", v)}      label="Otwieraj zlecenia w nowej karcie" />
        <Toggle checked={form.interfaceSounds}   onChange={(v) => update("interfaceSounds", v)}   label="Dźwięki interfejsu" />
        <Toggle checked={form.keyboardShortcuts} onChange={(v) => update("keyboardShortcuts", v)} label="Skróty klawiszowe" />
        <Toggle checked={form.focusMode}         onChange={(v) => update("focusMode", v)}         label="Tryb skupienia (ukryj panel boczny)" />
      </div>

      <SaveRow dirty={isDirty} saving={saving} onSave={handleSave}
        onReset={() => setForm({ ...preferences })} />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const tabs: Tab[] = [
  { id: "profile",       label: "Profil",         icon: <Ico d={IC.profile} /> },
  { id: "security",      label: "Bezpieczeństwo",  icon: <Ico d={IC.security} /> },
  { id: "notifications", label: "Powiadomienia",   icon: <Ico d={IC.notifications} /> },
  { id: "permissions",   label: "Uprawnienia",     icon: <Ico d={IC.permissions} /> },
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
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
    permissions:   <PermissionsTab />,
    preferences:   <PreferencesTab />,
  };

  return (
    <div className={cn("flex h-full", BG)}>
      <aside className="w-52 shrink-0 flex flex-col border-r border-white/[0.06] py-4 px-3">
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
                      active ? "font-semibold" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
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
