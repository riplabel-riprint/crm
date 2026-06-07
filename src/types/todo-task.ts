export type TodoPriority = "normal" | "high";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoCategory = {
  id: string;
  name: string;
  color: string; // hex or tailwind-like token
  icon: string;  // emoji
};

export type TodoTask = {
  id: string;
  title: string;
  priority: TodoPriority;
  dueDate: string; // YYYY-MM-DD
  done: boolean;
  doneAt?: string; // YYYY-MM-DD
  createdAt: string;
  checklist: ChecklistItem[];
  categoryId?: string;
};
