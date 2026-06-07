export type GoalTaskItem = {
  id: string;
  text: string;
  done: boolean;
};

export type GoalMilestone = {
  id: string;
  name: string;
  tasks: GoalTaskItem[];
};

// Typ 1 – cel bez daty
export type GoalFlex = {
  kind: "flex";
  id: string;
  name: string;
  createdAt: string;
  tasks: GoalTaskItem[];
};

// Typ 2 – cel z milestone'ami i datą końcową
export type GoalMilestoned = {
  kind: "milestoned";
  id: string;
  name: string;
  createdAt: string;
  dueDate: string; // YYYY-MM-DD
  milestones: GoalMilestone[];
};

export type Goal = GoalFlex | GoalMilestoned;
