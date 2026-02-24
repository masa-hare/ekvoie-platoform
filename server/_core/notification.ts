export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Log notifications to the server console.
 * Extend this function to add email/webhook notifications as needed.
 * No external service dependency required.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  if (!payload.title?.trim() || !payload.content?.trim()) {
    return false;
  }
  console.log(`[Notification] ${payload.title}`);
  console.log(`[Notification] ${payload.content}`);
  return true;
}
