import { getSender } from "@/lib/azure/serviceBusClient";

export enum NotificationType {
  REVIEW_REPLY = "review_reply",
  NEW_REVIEW = "new_review",
  BOOKING_CONFIRMED = "booking_confirmed",
  BOOKING_CANCELLED = "booking_cancelled",
  MESSAGE_RECEIVED = "message_received",
}

export interface NotificationPayload {
  type: NotificationType;
  recipientUserId: number;
  data: {
    reviewId?: number;
    toolId?: number;
    ownerId?: string;
    replyText?: string;
    reviewerName?: string;
    toolName?: string;
    [key: string]: any;
  };
  metadata: {
    timestamp: string;
    priority: "high" | "medium" | "low";
  };
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  try {
    const sender = getSender();
    
    const message = {
      body: payload,
      contentType: "application/json",
      subject: payload.type,
      applicationProperties: {
        notificationType: payload.type,
        recipientUserId: payload.recipientUserId,
        priority: payload.metadata.priority,
      },
    };

    await sender.sendMessages(message);
    console.log("✅ Notification envoyée:", payload.type);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification:", error);
    // Ne pas faire échouer la requête principale
    // Logger dans un système de monitoring (ex: Application Insights)
  }
}