"use client";

import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders-store";
import type { ViewOrderStage, ViewOrderTask } from "@/types/order-view";

type Props = {
  orderId: string;
  status?: string;
  stages: ViewOrderStage[];
  tasks: ViewOrderTask[];
};

const STATUS_STEPS: { value: string; label: string }[] = [
  { value: "draft",            label: "Szkic" },
  { value: "quote_sent",       label: "Wycena wysłana" },
  { value: "quote_accepted",   label: "Wycena przyjęta" },
  { value: "in_production",    label: "W produkcji" },
  { value: "ready_for_pickup", label: "Gotowe do odbioru" },
  { value: "delivered",        label: "Dostarczone" },
  { value: "invoiced",         label: "Zafakturowane" },
  { value: "completed",        label: "Zakończone" },
];

function getStatusProgress(status?: string): { pct: number; stepIdx: number; cancelled: boolean } {
  if (status === "cancelled") return { pct: 100, stepIdx: -1, cancelled: true };
  const idx = STATUS_STEPS.findIndex((s) => s.value === status);
  if (idx < 0) return { pct: 0, stepIdx: 0, cancelled: false };
  const pct = Math.round((idx / (STATUS_STEPS.length - 1)) * 100);
  return { pct, stepIdx: idx, cancelled: false };
}

export function StagesPanel({ orderId, status: statusProp, stages, tasks }: Props) {
  const updateTaskDone = useOrdersStore((s) => s.updateTaskDone);
  const advanceStage = useOrdersStore((s) => s.advanceStage);
  const setActiveStage = useOrdersStore((s) => s.setActiveStage);
  const liveOrder = useOrdersStore((s) => s.getOrderById(orderId));
  const status = liveOrder?.status ?? statusProp;

  const { pct: progressPct, stepIdx, cancelled } = getStatusProgress(status);

  const activeStage = stages.find((s) => s.status === "Aktywny");
  const activeTasks = activeStage ? tasks.filter((t) => t.stageId === activeStage.id) : [];
  const allRequiredDone = activeTasks.filter((t) => t.required).every((t) => t.done);
  const hasNext = activeStage
    ? stages.findIndex((s) => s.id === activeStage.id) < stages.length - 1
    : false;

  return (
    <div className="space-y-4">
      {/* Status progress */}
      <Card>
        <CardBody className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-white/70">Postęp realizacji</span>
            {cancelled ? (
              <span className="text-xs font-medium text-red-400 bg-red-500/10 rounded px-2 py-0.5">Anulowane</span>
            ) : (
              <span className="text-xs text-white/40">{progressPct}%</span>
            )}
          </div>

          {/* Bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden mb-4">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                cancelled ? "bg-red-500/60" : progressPct === 100 ? "bg-green-500" : "bg-gradient-to-r from-[#c93a00] via-[#fe4e00] to-[#ff8c4b]"
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Steps */}
          {!cancelled && (
            <div className="flex items-start justify-between gap-0.5">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < stepIdx;
                const active = idx === stepIdx;
                return (
                  <div key={step.value} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      done  ? "bg-[#fe4e00]" :
                      active ? "bg-white ring-2 ring-[#fe4e00]/50 ring-offset-1 ring-offset-[#1a1a1a]" :
                               "bg-white/15"
                    )} />
                    <span className={cn(
                      "text-[9px] text-center leading-tight hidden sm:block truncate w-full px-0.5",
                      active ? "text-white/70 font-medium" : done ? "text-white/30" : "text-white/15"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stages list */}
      <Card>
        <CardHeader>
          <CardTitle>Etapy</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <ol className="divide-y divide-white/[0.05]">
            {stages.map((stage, idx) => (
              <StageRow
                key={stage.id}
                stage={stage}
                position={idx + 1}
                isActive={stage.id === activeStage?.id}
                onClick={() => {
                  if (stage.status !== "Aktywny") setActiveStage(orderId, stage.id);
                }}
              />
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Active stage tasks */}
      {activeStage && activeTasks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Zadania — {activeStage.name}</CardTitle>
            <span className="text-[11px] text-white/30">
              {activeTasks.filter((t) => t.done).length}/{activeTasks.length}
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-white/[0.05]">
              {activeTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => updateTaskDone(orderId, task.stageId, task.id, !task.done)}
                />
              ))}
            </ul>
            {hasNext && (
              <div className="px-5 py-3 border-t border-white/[0.05]">
                <button
                  onClick={() => advanceStage(orderId, activeStage.id)}
                  disabled={!allRequiredDone}
                  className={cn(
                    "w-full rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    allRequiredDone
                      ? "bg-[#fe4e00] text-white hover:bg-[#fe4e00] active:scale-[0.98]"
                      : "bg-white/[0.05] text-white/25 cursor-not-allowed"
                  )}
                >
                  {allRequiredDone
                    ? "Przejdź do następnego etapu →"
                    : "Ukończ wymagane zadania, aby przejść dalej"}
                </button>
              </div>
            )}
            {!hasNext && activeStage.status !== "Zakończony" && (
              <div className="px-5 py-3 border-t border-white/[0.05]">
                <button
                  onClick={() => advanceStage(orderId, activeStage.id)}
                  disabled={!allRequiredDone}
                  className={cn(
                    "w-full rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    allRequiredDone
                      ? "bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]"
                      : "bg-white/[0.05] text-white/25 cursor-not-allowed"
                  )}
                >
                  {allRequiredDone ? "Zakończ zlecenie ✓" : "Ukończ wymagane zadania"}
                </button>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StageRow({
  stage,
  position,
  isActive,
  onClick,
}: {
  stage: ViewOrderStage;
  position: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const isCompleted = stage.status === "Zakończony";

  return (
    <li
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 px-5 py-3.5 text-sm transition-colors",
        isActive ? "bg-[#fe4e00]/10" : !isCompleted && "hover:bg-white/[0.03] cursor-pointer",
        isCompleted && "opacity-60"
      )}
    >
      <StageIcon status={stage.status} position={position} />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium leading-tight",
          isCompleted ? "text-white/30 line-through" : "text-white/80",
          isActive && "text-[#fe4e00] no-underline font-semibold"
        )}>
          {stage.name}
        </p>
        {isActive && stage.totalTasks > 0 && (
          <p className="text-xs text-[#fe4e00]/70 mt-0.5">
            {stage.completedTasks} / {stage.totalTasks} zadań
          </p>
        )}
      </div>
      <StageStatusChip status={stage.status} />
    </li>
  );
}

function StageIcon({ status, position }: { status: ViewOrderStage["status"]; position: number }) {
  if (status === "Zakończony") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "Aktywny") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fe4e00] text-white text-[10px] font-bold">
        {position}
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/30 font-medium">
      {position}
    </span>
  );
}

function StageStatusChip({ status }: { status: ViewOrderStage["status"] }) {
  const map: Record<ViewOrderStage["status"], { label: string; cls: string }> = {
    Oczekuje: { label: "Oczekuje", cls: "text-white/25" },
    Aktywny: { label: "Aktywny", cls: "text-[#fe4e00] font-medium" },
    Zakończony: { label: "Gotowy", cls: "text-green-400" },
  };
  const { label, cls } = map[status];
  return <span className={cn("text-xs shrink-0", cls)}>{label}</span>;
}

function TaskRow({ task, onToggle }: { task: ViewOrderTask; onToggle: () => void }) {
  return (
    <li
      onClick={onToggle}
      className="flex items-start gap-3 px-5 py-3 text-sm cursor-pointer hover:bg-white/[0.03] transition-colors active:bg-white/[0.06]"
    >
      <TaskCheckbox done={task.done} />
      <p className={cn(
        "flex-1 leading-snug select-none",
        task.done ? "text-white/25 line-through" : "text-white/75"
      )}>
        {task.title}
        {task.required && !task.done && (
          <span className="ml-1.5 text-[10px] text-white/25 bg-white/[0.06] rounded px-1 py-0.5">wymagane</span>
        )}
      </p>
    </li>
  );
}

function TaskCheckbox({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-green-500 text-white transition-colors">
        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-transparent hover:border-white/40 transition-colors" />
  );
}
