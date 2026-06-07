export type ProjectStatus = "W realizacji" | "Planowanie" | "Zakończony" | "Wstrzymany";
export type ProjectPriority = "Niski" | "Średni" | "Wysoki" | "Krytyczny";

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  tasks: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  category: "design" | "reports" | "contracts" | "references";
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "W toku" | "Do zrobienia" | "Ukończone" | "W recenzji";
  dueDate: string;
}

export interface ProjectActivity {
  id: string;
  type: "milestone" | "file" | "task" | "comment" | "report" | "member" | "deadline";
  title: string;
  description: string;
  date: string;
  author: string;
  tag?: string;
}

export interface Project {
  id: string;
  number: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  department: string;
  manager: string;
  budget: number;
  spent: number;
  startDate: string;
  dueDate: string;
  assignedDate: string;
  members: ProjectMember[];
  files: ProjectFile[];
  tasks: ProjectTask[];
  activity: ProjectActivity[];
  deliverables: string[];
  coverColor: string;
  coverIcon: string;
}
