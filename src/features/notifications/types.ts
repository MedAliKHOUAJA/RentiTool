
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