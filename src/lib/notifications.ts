// Thin helper around the Notification model — every call site should be a
// genuine event (onboarding finished, credits running low, etc.), never a
// permanent fixture. See prisma/schema.prisma Notification for the shape.
import { db } from "@/lib/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}
