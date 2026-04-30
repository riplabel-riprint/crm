"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="mt-0.5 text-[11px] font-medium text-white/50 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const IconPrint = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconOrders = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const IconClients = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconEye = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconGoogle = (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [remember,    setRemember]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [emailFocus,  setEmailFocus]  = useState(false);
  const [passFocus,   setPassFocus]   = useState(false);

  const router = useRouter();
  const login = useUserStore((s) => s.login);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const namePart = email.split("@")[0].replace(/[._-]/g, " ");
      const name = namePart
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      login({ id: "user-001", name, email, role: "admin" });
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className="flex min-h-screen bg-white">

      {/* ── Left: branding panel ─────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col overflow-hidden bg-[#1C2434]">

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Radial glow top-left */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#3C50E0] opacity-20 blur-3xl pointer-events-none" />
        {/* Radial glow bottom-right */}
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[#3C50E0] opacity-15 blur-3xl pointer-events-none" />

        {/* Top logo bar */}
        <div className="relative flex items-center gap-3 px-10 pt-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3C50E0]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Ri<span className="text-[#3C50E0]">print</span>
          </span>
          <span className="ml-1 rounded bg-[#3C50E0]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#3C50E0]">
            Panel
          </span>
        </div>

        {/* Main hero content */}
        <div className="relative flex flex-1 flex-col justify-center px-10 pb-10 pt-0">
          <div className="max-w-[420px]">
            {/* Tag */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3C50E0]/30 bg-[#3C50E0]/10 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3C50E0] animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-[#7B8FF7]">Panel operacyjny drukarni</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
              Zarządzaj zleceniami<br />
              <span className="text-[#3C50E0]">szybciej</span> i mądrzej.
            </h1>
            <p className="mt-4 text-base text-white/50 leading-relaxed">
              Riprint to kompleksowy system dla drukarni cyfrowych — od wyceny po dostawę. Wszystko w jednym miejscu.
            </p>

            {/* Stats */}
            <div className="mt-8 flex gap-3">
              <StatPill value="12k+" label="Zleceń" />
              <StatPill value="98%"  label="Terminowość" />
              <StatPill value="4.9★" label="Ocena" />
            </div>

            {/* Features */}
            <div className="mt-10 space-y-5">
              <Feature
                icon={IconPrint}
                title="Kreator nadruków i odzieży"
                desc="Projektuj nadruki i konfiguruj odzież bezpośrednio w przeglądarce."
              />
              <Feature
                icon={IconOrders}
                title="Workflow i śledzenie zleceń"
                desc="Etapy produkcji, powiadomienia i historia każdego zamówienia."
              />
              <Feature
                icon={IconClients}
                title="CRM klientów i wyceny"
                desc="Baza klientów, szablony ofert i automatyczna kalkulacja cen."
              />
            </div>
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative border-t border-white/[0.07] px-10 py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3C50E0]/25 text-sm font-bold text-[#7B8FF7]">
              MK
            </div>
            <div>
              <p className="text-sm text-white/70 leading-relaxed">
                &ldquo;Od kiedy używamy Riprint, czas obsługi zlecenia skrócił się o 40%.&rdquo;
              </p>
              <p className="mt-1.5 text-xs font-semibold text-white/35">
                Marta Kowalska — Kierownik produkcji, PrintHouse Wrocław
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: login card ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F1F5F9] px-6 py-12">

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C2434]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Ri<span className="text-[#3C50E0]">print</span></span>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-gray-200/80 bg-white px-8 py-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]">

            {/* Card header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Zaloguj się</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Witaj z powrotem — wprowadź dane konta.
              </p>
            </div>

            {/* Google SSO */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.99]"
            >
              {IconGoogle}
              Kontynuuj przez Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs font-medium text-gray-400">lub e-mail</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adres e-mail
                </label>
                <div className={`flex items-center rounded-xl border bg-white transition-all ${
                  emailFocus ? "border-[#3C50E0] ring-3 ring-[#3C50E0]/10" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center pl-3.5 text-gray-400 shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    placeholder="jan@firma.pl"
                    required
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Hasło
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-medium text-[#3C50E0] hover:text-[#3346C8] hover:underline transition-colors"
                  >
                    Nie pamiętam hasła
                  </Link>
                </div>
                <div className={`flex items-center rounded-xl border bg-white transition-all ${
                  passFocus ? "border-[#3C50E0] ring-3 ring-[#3C50E0]/10" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center pl-3.5 text-gray-400 shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocus(true)}
                    onBlur={() => setPassFocus(false)}
                    placeholder="••••••••"
                    required
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    aria-label={showPass ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showPass ? IconEyeOff : IconEye}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember(!remember)}
                  className={`flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-all ${
                    remember
                      ? "border-[#3C50E0] bg-[#3C50E0]"
                      : "border-gray-300 bg-white hover:border-[#3C50E0]"
                  }`}
                >
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-sm text-gray-600 select-none cursor-pointer" onClick={() => setRemember(!remember)}>
                  Zapamiętaj mnie na tym urządzeniu
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1C2434] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#252f41] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity=".4"/>
                      <path d="M12 2v4" strokeOpacity="1"/>
                    </svg>
                    Logowanie…
                  </>
                ) : (
                  <>
                    Zaloguj się
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-400">
              Nie masz konta?{" "}
              <Link href="#" className="font-semibold text-[#3C50E0] hover:text-[#3346C8] hover:underline transition-colors">
                Skontaktuj się z administratorem
              </Link>
            </p>
          </div>

          {/* Below-card note */}
          <p className="mt-5 text-center text-[11px] text-gray-400">
            Logując się, akceptujesz{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Regulamin</Link>
            {" "}i{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-gray-600 transition-colors">Politykę prywatności</Link>.
          </p>
        </div>
      </div>

    </div>
  );
}
