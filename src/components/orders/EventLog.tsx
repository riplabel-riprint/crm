import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";
import type { OrderEvent, OrderEventType } from "@/types";

const eventConfig: Record<
  OrderEventType,
  { label: string; icon: string; color: string }
> = {
  order_created: { label: "Zlecenie utworzone", icon: "📋", color: "bg-gray-100" },
  order_status_changed: { label: "Zmiana statusu", icon: "🔄", color: "bg-blue-50" },
  revision_created: { label: "Wycena przygotowana", icon: "📄", color: "bg-purple-50" },
  revision_accepted: { label: "Wycena zaakceptowana", icon: "✅", color: "bg-green-50" },
  revision_rejected: { label: "Wycena odrzucona", icon: "❌", color: "bg-red-50" },
  stage_started: { label: "Etap rozpoczęty", icon: "▶️", color: "bg-blue-50" },
  stage_completed: { label: "Etap ukończony", icon: "🏁", color: "bg-green-50" },
  task_completed: { label: "Zadanie ukończone", icon: "☑️", color: "bg-gray-50" },
  comment_added: { label: "Komentarz", icon: "💬", color: "bg-amber-50" },
  file_uploaded: { label: "Plik dodany", icon: "📎", color: "bg-gray-50" },
  deadline_changed: { label: "Zmiana terminu", icon: "📅", color: "bg-yellow-50" },
  assigned_changed: { label: "Zmiana przypisania", icon: "👤", color: "bg-gray-50" },
};

function eventDescription(event: OrderEvent): string {
  const p = event.payload as Record<string, unknown>;
  switch (event.type) {
    case "order_status_changed":
      return `Status: ${p.from} → ${p.to}`;
    case "revision_created":
      return `Rewizja #${p.revisionNumber}`;
    case "revision_accepted":
      return `Rewizja #${p.revisionNumber}`;
    case "stage_started":
    case "stage_completed":
      return String(p.stageName ?? "");
    default:
      return "";
  }
}

export function EventLog({ events }: { events: OrderEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historia zdarzeń</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        <ul className="divide-y divide-gray-100">
          {events.map((event, idx) => {
            const cfg = eventConfig[event.type];
            const desc = eventDescription(event);
            const isFirst = idx === 0;

            return (
              <li
                key={event.id}
                className={[
                  "flex gap-3 px-5 py-3.5 text-sm",
                  isFirst ? "bg-amber-50/50" : "hover:bg-gray-50 transition-colors",
                ].join(" ")}
              >
                {/* icon */}
                <div
                  className={[
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm",
                    cfg.color,
                  ].join(" ")}
                >
                  <span role="img" aria-hidden>
                    {cfg.icon}
                  </span>
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{cfg.label}</span>
                    <time className="text-xs text-gray-400 shrink-0">
                      {formatDateTime(event.createdAt)}
                    </time>
                  </div>

                  {desc && <p className="text-gray-500 mt-0.5">{desc}</p>}

                  {event.comment && (
                    <blockquote className="mt-1.5 rounded-md border-l-2 border-gray-200 pl-2.5 text-gray-600 italic">
                      {event.comment}
                    </blockquote>
                  )}

                  {event.actorName && (
                    <p className="mt-1 text-xs text-gray-400">{event.actorName}</p>
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
