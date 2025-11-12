/**
 * Types partagés pour le système de notifications
 */

export enum NotificationType {
    NEW_REVIEW = 'NEW_REVIEW',
    REVIEW_REPLY = 'REVIEW_REPLY',
    BOOKING_REQUESTED = 'BOOKING_REQUESTED',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    BOOKING_ACCEPTED = 'BOOKING_ACCEPTED',
    BOOKING_REJECTED = 'BOOKING_REJECTED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    TOOL_APPROVED = 'TOOL_APPROVED',
    TOOL_REJECTED = 'TOOL_REJECTED',
  }
  
  export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
  }
  
  export enum NotificationChannel {
    EMAIL = 'EMAIL',
    IN_APP = 'IN_APP',
    PUSH = 'PUSH',
  }
  
  export interface ServiceBusNotificationPayload {
    type: NotificationType;
    recipientUserId: string;
    title: string;
    message: string;
    data: Record<string, any>;
    metadata: {
      timestamp: string;
      priority: NotificationPriority;
      channels: NotificationChannel[];
    };
  }
  
  export interface User {
    UserId: string;
    Email: string;
    FirstName: string;
    LastName: string;
    EnableEmail: boolean;
    EnableInApp: boolean;
    EnablePush: boolean;
  }