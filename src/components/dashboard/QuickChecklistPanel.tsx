"use client";

import type { TodoTask } from "@/types/todo-task";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  tasks: TodoTask[];
  onToggle: (id: string) => void;
};

export function QuickChecklistPanel({ tasks, onToggle }: Props) {
  const today = todayStr();

  const overdue = tasks.filter((t) => t.dueDate < today && !t.done);
  const todayTasks = tasks.filter((t) => t.dueDate === today);

  const items = [
    ...overdue.map((t) => ({ ...t, _overdue: true })),
    ...todayTasks.map((t) => ({ ...t, _overdue: false })),
  ].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    return 0;
  });

  const active = items.filter((t) => !t.done).length;
  const done = items.filter((t) => t.done).length;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700">Lista dziś</h3>
          <div className="flex items-center gap-1.5">
            {active > 0 && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                {active}
              </span>
            )}
            {done > 0 && (
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                ✓{done}
              </span>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-300"
              style={{ width: items.length > 0 ? `${Math.round((done / items.length) * 100)}%` : "0%" }}
            />
          </div>
        )}
      </div>

      {/* List */}
      <ul className="flex-1 divide-y divide-gray-50 overflow-y-auto">
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-gray-400">
            Brak zadań na dziś
          </li>
        )}
        {items.map((task) => (
          <li
            key={task.id}
            className={`flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-gray-50 ${
              task._overdue && !task.done ? "bg-red-50/30" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task.id)}
              className="mt-0.5 h-3.5 w-3.5 flex-none cursor-pointer rounded border-gray-300 accent-indigo-500"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs leading-snug ${
                  task.done ? "text-gray-400 line-through" : task._overdue ? "text-red-700" : "text-gray-700"
                }`}
              >
                {task.title}
              </p>
              {(task.priority === "high" || task._overdue) && !task.done && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  {task._overdue && (
                    <span className="text-[9px] font-semibold text-red-400">
                      {new Date(task.dueDate + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  {task.priority === "high" && (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-red-500">
                      <span className="h-1 w-1 rounded-full bg-red-500" />
                      Wysoki
                    </span>
                  )}
                </div>
              )}
              {task.checklist.length > 0 && (
                <p className="mt-0.5 text-[9px] text-gray-400">
                  ☑ {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
