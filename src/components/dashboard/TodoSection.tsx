"use client";

import { useTodoTasks } from "@/lib/hooks/useTodoTasks";
import { TodoDashboard } from "./TodoDashboard";

export function TodoSection() {
  const store = useTodoTasks();

  return (
    <TodoDashboard
      tasks={store.tasks}
      categories={store.categories}
      addTask={store.addTask}
      toggleTask={store.toggleTask}
      deleteTask={store.deleteTask}
      updateTask={store.updateTask}
      toggleChecklist={store.toggleChecklist}
      addChecklist={store.addChecklist}
      deleteChecklist={store.deleteChecklist}
      addCategory={store.addCategory}
      updateCategory={store.updateCategory}
      deleteCategory={store.deleteCategory}
    />
  );
}
