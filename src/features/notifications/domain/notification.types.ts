
export interface UserNotification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    data: any;
    read: boolean;
    createdAt: Date;
  }
  
  export interface NotificationPreferences {
    userId: number;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    reviewReplyEnabled: boolean;
    newReviewEnabled: boolean;
    bookingEnabled: boolean;
    messageEnabled: boolean;
  }
  export enum NotificationType {
    REVIEW_REPLY = 'review_reply',
    NEW_REVIEW = 'new_review',
    BOOKING_CONFIRMED = 'booking_confirmed',
    BOOKING_CANCELLED = 'booking_cancelled',
    BOOKING_REQUESTED = 'booking_requested',
    BOOKING_ACCEPTED = 'booking_accepted',
    BOOKING_REJECTED = 'booking_rejected',
    MESSAGE_RECEIVED = 'message_received',
    TOOL_APPROVED = 'tool_approved',
    TOOL_REJECTED = 'tool_rejected',
    PAYMENT_RECEIVED = 'payment_received',
    PAYMENT_FAILED = 'payment_failed',
  }
  
  export enum NotificationPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
  }
  
  export enum NotificationChannel {
    IN_APP = 'in_app',
    EMAIL = 'email',
    PUSH = 'push',
  }
  
  export enum NotificationStatus {
    SENT = 'sent',
    FAILED = 'failed',
    PENDING = 'pending',
  }
  
  export interface Notification {
    notificationId: number;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    priority: NotificationPriority;
    toolId?: number;
    rentalId?: number;
    ratingId?: number;
  }
  
  export interface NotificationPreferences {
    preferenceId: number;
    userId: number;
    enableInApp: boolean;
    enableEmail: boolean;
    enablePush: boolean;
    notifyOnReviewReply: boolean;
    notifyOnNewReview: boolean;
    notifyOnBookingConfirmed: boolean;
    notifyOnBookingCancelled: boolean;
    notifyOnMessageReceived: boolean;
    updatedAt: Date;
  }
  
  export interface PushToken {
    tokenId: number;
    userId: string;
    token: string;
    deviceType: 'ios' | 'android' | 'web';
    deviceId?: string;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt: Date;
  }
  
  export interface NotificationLog {
    logId: number;
    notificationId: number;
    channel: NotificationChannel;
    status: NotificationStatus;
    error?: string;
    sentAt: Date;
  }
  
  export interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    toolId?: number;
    rentalId?: number;
    ratingId?: number;
  }
  
  export interface ServiceBusNotificationPayload {
    type: NotificationType;
    recipientUserId: string;
    title: string;
    message: string;
    data: {
      toolId?: number;
      rentalId?: number;
      ratingId?: number;
      reviewId?: number;
      ownerId?: string;
      renterId?: string;
      replyText?: string;
      reviewerName?: string;
      toolName?: string;
      [key: string]: any;
    };
    metadata: {
      timestamp: string;
      priority: NotificationPriority;
      channels: NotificationChannel[];
    };
  }
  
  export interface NotificationTemplate {
    type: NotificationType;
    getTitle: (data: any) => string;
    getMessage: (data: any) => string;
    priority: NotificationPriority;
    channels: NotificationChannel[];
  }