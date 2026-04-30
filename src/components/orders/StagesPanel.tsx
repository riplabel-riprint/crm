import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ViewOrderStage, ViewOrderTask } from "@/types/order-view";

type Props = {
  stages: ViewOrderStage[];
  tasks: ViewOrderTask[];
};

export function StagesPanel({ stages, tasks }: Props) {
  const completed = stages.filter((s) => s.status === "Zakończony").length;
  const total = stages.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const activeStage = stages.find((s) => s.status === "Aktywny");
  const activeTasks = activeStage
    ? tasks.filter((t) => t.stageId === activeStage.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium text-gray-700">Postęp realizacji</span>
            <span className="text-gray-500">
              {completed} / {total} etapów
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 text-right">{progressPct}%</p>
        </CardBody>
      </Card>

      {/* Stages list */}
      <Card>
        <CardHeader>
          <CardTitle>Etapy</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <ol className="divide-y divide-gray-100">
            {stages.map((stage, idx) => (
              <StageRow
                key={stage.id}
                stage={stage}
                position={idx + 1}
                isActive={stage.id === activeStage?.id}
              />
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Active stage tasks */}
      {activeStage && activeTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zadania — {activeStage.name}</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-gray-100">
              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
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
}: {
  stage: ViewOrderStage;
  position: number;
  isActive: boolean;
}) {
  const isCompleted = stage.status === "Zakończony";

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-5 py-3.5 text-sm transition-colors",
        isActive && "bg-blue-50"
      )}
    >
      <StageIcon status={stage.status} position={position} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium leading-tight",
            isCompleted ? "text-gray-500 line-through" : "text-gray-900",
            isActive && "text-blue-700 no-underline font-semibold"
          )}
        >
          {stage.name}
        </p>
        {isActive && stage.totalTasks > 0 && (
          <p className="text-xs text-blue-500 mt-0.5">
            {stage.completedTasks} / {stage.totalTasks} zadań
          </p>
        )}
      </div>
      <StageStatusChip status={stage.status} />
    </li>
  );
}

function StageIcon({
  status,
  position,
}: {
  status: ViewOrderStage["status"];
  position: number;
}) {
  if (status === "Zakończony") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (status === "Aktywny") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
        {position}
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 text-[10px] text-gray-400 font-medium">
      {position}
    </span>
  );
}

function StageStatusChip({ status }: { status: ViewOrderStage["status"] }) {
  const map: Record<ViewOrderStage["status"], { label: string; cls: string }> = {
    Oczekuje: { label: "Oczekuje", cls: "text-gray-400" },
    Aktywny: { label: "Aktywny", cls: "text-blue-600 font-medium" },
    Zakończony: { label: "Gotowy", cls: "text-green-600" },
  };
  const { label, cls } = map[status];
  return <span className={cn("text-xs shrink-0", cls)}>{label}</span>;
}

function TaskRow({ task }: { task: ViewOrderTask }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3 text-sm">
      <TaskCheckbox done={task.done} />
      <p
        className={cn(
          "flex-1 leading-snug",
          task.done ? "text-gray-400 line-through" : "text-gray-800"
        )}
      >
        {task.title}
        {task.required && !task.done && (
          <span className="ml-1.5 text-xs text-gray-400">wymagane</span>
        )}
      </p>
    </li>
  );
}

function TaskCheckbox({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-green-500 text-white">
        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
          <path
            d="M1.5 5l2.5 2.5 4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-gray-200 bg-white" />
  );
}
