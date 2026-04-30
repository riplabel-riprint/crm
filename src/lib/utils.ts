import type { Money } from "@/types";

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 2,
  }).format(money.amount / 100);
}

export function makeMoney(grosze: number): Money {
  return { amount: grosze, currency: "PLN" };
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function generateOrderNumber(year: number, sequence: number): string {
  return `RIP-${year}-${String(sequence).padStart(4, "0")}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
