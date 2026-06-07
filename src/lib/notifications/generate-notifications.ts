import type { Notification } from "@/types/notifications";

// Returns no auto-generated notifications — only notifications added
// programmatically (e.g. on order creation) are shown.
export function generateNotifications(_userId: string): Notification[] {
  return [];
}
