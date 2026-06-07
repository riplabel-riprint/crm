"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompanySettings = {
  name: string;
  nip: string;
  regon: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
};

export type AppearanceSettings = {
  theme: "light" | "dark" | "system";
  accent: string;
  density: "compact" | "normal" | "comfortable";
  animations: boolean;
  roundedCards: boolean;
  highContrast: boolean;
};

export type PreferencesSettings = {
  startPage: string;
  ordersView: string;
  orderSort: string;
  recordsPerPage: string;
  autosaveDrafts: boolean;
  confirmDelete: boolean;
  openInNewTab: boolean;
  interfaceSounds: boolean;
  keyboardShortcuts: boolean;
  focusMode: boolean;
  printTechnique: string;
  previewSize: string;
  exportFormat: string;
};

export type NotifPrefs = Record<string, { email: boolean; push: boolean }>;

export type MemberRole = "Administrator" | "Menedżer" | "Pracownik" | "Obserwator";
export type Member = {
  id?: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar: string;
  status: "active" | "invited";
};

export type Integration = {
  name: string;
  desc: string;
  logo: string;
  connected: boolean;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_COMPANY: CompanySettings = {
  name: "Riprint Sp. z o.o.",
  nip: "1234567890",
  regon: "123456789",
  street: "ul. Drukarska 12/3",
  city: "Warszawa",
  zip: "00-001",
  country: "🇵🇱 Polska",
  phone: "+48 22 123 45 67",
  email: "kontakt@riprint.pl",
  website: "https://riprint.pl",
  logoUrl: null,
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "dark",
  accent: "#fe4e00",
  density: "normal",
  animations: true,
  roundedCards: true,
  highContrast: false,
};

const DEFAULT_PREFERENCES: PreferencesSettings = {
  startPage: "Dashboard",
  ordersView: "Lista",
  orderSort: "Data (najnowsze)",
  recordsPerPage: "25",
  autosaveDrafts: true,
  confirmDelete: true,
  openInNewTab: false,
  interfaceSounds: true,
  keyboardShortcuts: true,
  focusMode: false,
  printTechnique: "DTG",
  previewSize: "Średni (300px)",
  exportFormat: "PDF",
};

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  "nowe-zlecenie":             { email: true,  push: true  },
  "zmiana-statusu":            { email: true,  push: true  },
  "zlecenie-przeterminowane":  { email: true,  push: false },
  "nowy-klient":               { email: false, push: true  },
  "wiadomosc-od-klienta":      { email: true,  push: true  },
  "logowanie-nowe-urzadzenie": { email: true,  push: true  },
  "aktualizacje-systemu":      { email: true,  push: false },
  "raport-tygodniowy":         { email: true,  push: false },
};

const DEFAULT_MEMBERS: Member[] = [];

const DEFAULT_INTEGRATIONS: Integration[] = [
  { name: "Allegro",        desc: "Synchronizuj zamówienia z Allegro",         logo: "AL", connected: true  },
  { name: "WooCommerce",    desc: "Integracja ze sklepem WooCommerce",          logo: "WC", connected: true  },
  { name: "Fakturownia",    desc: "Automatyczne wystawianie faktur",            logo: "FK", connected: false },
  { name: "BaseLinker",     desc: "Wielokanałowe zarządzanie sprzedażą",        logo: "BL", connected: false },
  { name: "InPost",         desc: "Etykiety i śledzenie paczek",                logo: "IN", connected: true  },
  { name: "Slack",          desc: "Powiadomienia na kanałach Slack",            logo: "SL", connected: false },
  { name: "Zapier",         desc: "Automatyzacja z 5000+ aplikacjami",          logo: "ZP", connected: false },
  { name: "Google Sheets",  desc: "Eksport raportów do arkuszy",                logo: "GS", connected: false },
];

// ─── Store ────────────────────────────────────────────────────────────────────

type SettingsState = {
  company: CompanySettings;
  appearance: AppearanceSettings;
  preferences: PreferencesSettings;
  notifPrefs: NotifPrefs;
  members: Member[];
  integrations: Integration[];
  twoFAEnabled: boolean;

  setCompany: (data: CompanySettings) => void;
  setAppearance: (data: AppearanceSettings) => void;
  setPreferences: (data: PreferencesSettings) => void;
  setNotifPrefs: (data: NotifPrefs) => void;
  setMemberRole: (email: string, role: MemberRole) => void;
  removeMember: (email: string) => void;
  addMember: (member: Member) => void;
  syncMember: (member: Member) => void;
  toggleIntegration: (name: string) => void;
  setTwoFA: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      company:      DEFAULT_COMPANY,
      appearance:   DEFAULT_APPEARANCE,
      preferences:  DEFAULT_PREFERENCES,
      notifPrefs:   DEFAULT_NOTIF_PREFS,
      members:      DEFAULT_MEMBERS,
      integrations: DEFAULT_INTEGRATIONS,
      twoFAEnabled: false,

      setCompany:     (data) => set({ company: data }),
      setAppearance:  (data) => set({ appearance: data }),
      setPreferences: (data) => set({ preferences: data }),
      setNotifPrefs:  (data) => set({ notifPrefs: data }),

      setMemberRole: (email, role) =>
        set((s) => ({
          members: s.members.map((m) => m.email === email ? { ...m, role } : m),
        })),

      removeMember: (email) =>
        set((s) => ({ members: s.members.filter((m) => m.email !== email) })),

      addMember: (member) =>
        set((s) => ({ members: [...s.members, member] })),

      syncMember: (member) =>
        set((s) => {
          const exists = s.members.some((m) => m.id === member.id || m.email === member.email);
          if (exists) {
            return {
              members: s.members.map((m) =>
                (m.id === member.id || m.email === member.email) ? { ...m, ...member } : m
              ),
            };
          }
          return { members: [member, ...s.members] };
        }),

      toggleIntegration: (name) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.name === name ? { ...i, connected: !i.connected } : i
          ),
        })),

      setTwoFA: (enabled) => set({ twoFAEnabled: enabled }),
    }),
    { name: "riprint-settings-store" }
  )
);
