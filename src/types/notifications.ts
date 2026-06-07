export type UserRole = "admin" | "manager" | "marketing";

export type AppUser = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
};

export type NotificationEntityType = "order" | "task" | "client" | "gadgetProject";

export type NotificationType = "info" | "warning" | "urgent" | "success" | "task" | "deadline";

export type NotificationPriority = "low" | "medium" | "high";

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  relatedEntityType: NotificationEntityType;
  relatedEntityId: string;
  actionUrl?: string;
  remindAt?: string | null;
  isReminded?: boolean;
  snoozedUntil?: string | null;
};

export interface ReminderOption {
  id: "now" | "5min" | "1hour" | "tomorrow-9am" | "3days" | "custom";
  label: string;
  getTime: (baseDate?: Date) => Date;
}

export interface ReminderState {
  notificationId: string;
  remindAt: Date;
  snoozedCount: number;
  wasTriggered: boolean;
}
