import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";
import type { OrderEvent, OrderEventType } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  quote_sent: "Wycena wysłana",
  quote_accepted: "Wycena przyjęta",
  in_production: "W produkcji",
  ready_for_pickup: "Gotowe do odbioru",
  delivered: "Dostarczone",
  invoiced: "Zafakturowane",
  completed: "Zakończone",
  cancelled: "Anulowane",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niski",
  normal: "Normalny",
  high: "Wysoki",
  urgent: "Pilny",
};

const eventConfig: Record<
  OrderEventType,
  { label: string; icon: string; color: string }
> = {
  order_created:        { label: "Zlecenie utworzone",    icon: "📋", color: "bg-white/[0.05]" },
  order_status_changed: { label: "Zmiana statusu",        icon: "🔄", color: "bg-blue-500/10" },
  priority_changed:     { label: "Zmiana priorytetu",     icon: "⚡", color: "bg-amber-500/10" },
  revision_created:     { label: "Wycena przygotowana",   icon: "📄", color: "bg-purple-500/10" },
  revision_accepted:    { label: "Wycena zaakceptowana",  icon: "✅", color: "bg-green-500/10" },
  revision_rejected:    { label: "Wycena odrzucona",      icon: "❌", color: "bg-red-500/10" },
  stage_started:        { label: "Etap rozpoczęty",       icon: "▶️", color: "bg-blue-500/10" },
  stage_completed:      { label: "Etap ukończony",        icon: "🏁", color: "bg-green-500/10" },
  task_completed:       { label: "Zadanie",               icon: "☑️", color: "bg-white/[0.04]" },
  comment_added:        { label: "Komentarz",             icon: "💬", color: "bg-amber-500/10" },
  file_uploaded:        { label: "Plik dodany",           icon: "📎", color: "bg-white/[0.04]" },
  deadline_changed:     { label: "Zmiana terminu",        icon: "📅", color: "bg-yellow-500/10" },
  assigned_changed:     { label: "Zmiana przypisania",    icon: "👤", color: "bg-white/[0.04]" },
  client_changed:       { label: "Zmiana klienta",        icon: "🏢", color: "bg-indigo-500/10" },
  pricing_updated:      { label: "Aktualizacja wyceny",   icon: "💰", color: "bg-green-500/10" },
};

function eventDescription(event: OrderEvent): string {
  const p = event.payload as Record<string, unknown>;
  switch (event.type) {
    case "order_created":
      return String(p.title ?? p.orderNumber ?? "");
    case "order_status_changed": {
      const from = STATUS_LABELS[String(p.from)] ?? p.from;
      const to   = STATUS_LABELS[String(p.to)]   ?? p.to;
      return `${from} → ${to}`;
    }
    case "priority_changed": {
      const from = PRIORITY_LABELS[String(p.from)] ?? p.from;
      const to   = PRIORITY_LABELS[String(p.to)]   ?? p.to;
      return `${from} → ${to}`;
    }
    case "revision_created":
      return `Rewizja #${p.revisionNumber}${p.itemCount ? ` · ${p.itemCount} poz.` : ""}`;
    case "revision_accepted":
    case "revision_rejected":
      return `Rewizja #${p.revisionNumber}`;
    case "stage_started":
      return `${p.stageName ?? ""}${p.manual ? " (ręcznie)" : ""}`;
    case "stage_completed":
      return String(p.stageName ?? "");
    case "task_completed": {
      const name = String(p.taskName ?? "");
      const done = Boolean(p.done);
      return name ? `${done ? "✓" : "↩"} ${name}` : (done ? "Ukończono" : "Cofnięto");
    }
    case "deadline_changed": {
      const field = p.field === "plannedDeadline" ? "Planowany" : "Klient";
      const from = p.from ? String(p.from).slice(0, 10) : "—";
      const to   = p.to   ? String(p.to).slice(0, 10)   : "—";
      return `${field}: ${from} → ${to}`;
    }
    case "assigned_changed":
      return String(p.toName ?? p.to ?? "");
    case "client_changed":
      return `${p.from || "—"} → ${p.to || "—"}`;
    case "pricing_updated": {
      const from = typeof p.from === "number" ? (p.from / 100).toFixed(2) : "—";
      const to   = typeof p.to   === "number" ? (p.to   / 100).toFixed(2) : "—";
      return `${from} zł → ${to} zł netto (VAT ${p.vatRate}%)`;
    }
    default:
      return "";
  }
}

export function EventLog({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Historia zdarzeń</CardTitle></CardHeader>
        <CardBody>
          <p className="py-4 text-center text-sm text-white/25">Brak zdarzeń.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia zdarzeń</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <ul className="divide-y divide-white/[0.05]">
          {events.map((event, idx) => {
            const cfg = eventConfig[event.type];
            const desc = eventDescription(event);
            const isFirst = idx === 0;

            return (
              <li
                key={event.id}
                className={[
                  "flex gap-3 px-5 py-3.5 text-sm",
                  isFirst ? "bg-amber-500/[0.06]" : "hover:bg-white/[0.03] transition-colors",
                ].join(" ")}
              >
                <div className={["mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm", cfg.color].join(" ")}>
                  <span role="img" aria-hidden>{cfg.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="font-medium text-white/80">{cfg.label}</span>
                    <time className="text-xs text-white/30 shrink-0">
                      {formatDateTime(event.createdAt)}
                    </time>
                  </div>

                  {desc && <p className="text-white/50 mt-0.5">{desc}</p>}

                  {event.comment && (
                    <blockquote className="mt-1.5 rounded-md border-l-2 border-white/10 pl-2.5 text-white/50 italic">
                      {event.comment}
                    </blockquote>
                  )}

                  {event.actorName && (
                    <p className="mt-1 text-xs text-white/25">{event.actorName}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
