"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, X } from "lucide-react";
import type { Notification, ReminderState } from "@/types/notifications";
import {
  REMINDER_OPTIONS,
  SNOOZE_OPTIONS,
  dateToInputDateTime,
  inputDateTimeToDate,
} from "@/utils/reminder-helpers";

type Props = {
  notification: Notification;
  reminder?: ReminderState;
  onConfirm: (date: Date) => void;
  onSnooze?: (ms: number) => void;
  onClose: () => void;
};

export function ReminderModal({ notification, reminder, onConfirm, onSnooze, onClose }: Props) {
  const [mode, setMode] = useState<"set" | "snooze">(reminder?.wasTriggered ? "snooze" : "set");
  const [selectedOption, setSelectedOption] = useState(REMINDER_OPTIONS[1]);
  const [customDateTime, setCustomDateTime] = useState("");
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    setCustomDateTime(dateToInputDateTime(d));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleConfirm = () => {
    const date = activeTab === "preset" ? selectedOption.getTime() : inputDateTimeToDate(customDateTime);
    if (date < new Date()) {
      alert("Data musi być w przyszłości!");
      return;
    }
    onConfirm(date);
    onClose();
  };

  const handleSnooze = (ms: number) => {
    onSnooze?.(ms);
    onClose();
  };

  const previewDate = activeTab === "preset"
    ? selectedOption.getTime().toLocaleString("pl-PL")
    : customDateTime ? new Date(customDateTime).toLocaleString("pl-PL") : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#161616] p-6 shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "set" ? "Ustaw przypomnienie" : "Snoozuj"}
            </h2>
            <p className="mt-1 text-sm text-white/50">{notification.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode switch (only if reminder exists and not triggered) */}
        {reminder && !reminder.wasTriggered && (
          <div className="mb-6 flex gap-2">
            {(["set", "snooze"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                  mode === m ? "bg-[#fe4e00] text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/10",
                ].join(" ")}
              >
                {m === "set" ? "Zmień czas" : "Snoozuj"}
              </button>
            ))}
          </div>
        )}

        {/* Snooze mode */}
        {mode === "snooze" && (
          <div className="mb-6 space-y-2">
            {SNOOZE_OPTIONS.map((option) => (
              <button
                key={option.ms}
                onClick={() => handleSnooze(option.ms)}
                className="w-full rounded-lg bg-white/[0.05] px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10 active:bg-[#fe4e00]/20"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Set mode */}
        {mode === "set" && (
          <>
            <div className="mb-6 flex gap-2">
              {(["preset", "custom"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                    activeTab === tab ? "bg-[#fe4e00] text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/10",
                  ].join(" ")}
                >
                  {tab === "preset" ? "Szybkie opcje" : "Custom"}
                </button>
              ))}
            </div>

            {activeTab === "preset" && (
              <div className="mb-6 space-y-2">
                {REMINDER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option)}
                    className={[
                      "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition",
                      selectedOption.id === option.id
                        ? "bg-[#fe4e00] text-white"
                        : "bg-white/[0.05] text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "custom" && (
              <div className="mb-6 space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-white/70">Data i czas</span>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#fe4e00]/50 focus:bg-white/[0.05]"
                  />
                </label>
                <p className="text-xs text-white/40">
                  <Calendar size={12} className="inline mr-1" />
                  Data musi być w przyszłości
                </p>
              </div>
            )}

            <div className="mb-6 rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
              <p className="text-xs text-white/50 mb-1">Przypomnienie zaplanowane na:</p>
              <p className="text-sm font-semibold text-white">{previewDate}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-[#fe4e00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04500]"
              >
                Potwierdź
              </button>
            </div>
          </>
        )}

        {mode === "snooze" && (
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Anuluj
          </button>
        )}
      </div>
    </div>
  );
}
