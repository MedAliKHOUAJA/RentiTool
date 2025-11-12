'use client';

import { Notification, NotificationType } from '../../domain/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  notification: Notification;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function NotificationItem({
  notification,
  onClick,
  onDelete,
}: Props) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_REVIEW:
      case NotificationType.REVIEW_REPLY:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        );

      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_ACCEPTED:
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );

      case NotificationType.BOOKING_CANCELLED:
      case NotificationType.BOOKING_REJECTED:
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );

      case NotificationType.BOOKING_REQUESTED:
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );

      case NotificationType.MESSAGE_RECEIVED:
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );

      default:
        return (
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  // ✅ CORRECTION : Redirection selon le type de notification
  const getLink = () => {
    const { type, rentalId, toolId, ratingId } = notification;
  
    switch (type) {
      // 📅 Demande de réservation → Tools Management avec highlight
      case NotificationType.BOOKING_REQUESTED:
        if (rentalId) {
          return `/tools-management?tab=reserved&highlight=${rentalId}`;
        }
        return '/tools-management?tab=reserved';
  
      // ✅ Réservation acceptée/confirmée → Tools Management
      case NotificationType.BOOKING_ACCEPTED:
      case NotificationType.BOOKING_CONFIRMED:
        if (rentalId) {
          return `/tools-management?tab=reserved&highlight=${rentalId}`;
        }
        return '/tools-management?tab=reserved';
  
      // ❌ Réservation refusée/annulée → Tools Management
      case NotificationType.BOOKING_REJECTED:
      case NotificationType.BOOKING_CANCELLED:
        if (rentalId) {
          return `/tools-management?tab=reserved&highlight=${rentalId}`;
        }
        return '/tools-management?tab=reserved';
  
      // ⭐ Nouvel avis → Page des reviews de l'outil
      case NotificationType.NEW_REVIEW:
        if (toolId) {
          return `/listing-tool-detail?id=${toolId}#reviews`;
        }
        return '/account-reviews';
  
      // 💬 Réponse à un avis → Page account-reviews
      case NotificationType.REVIEW_REPLY:
        if (ratingId) {
          return `/account-reviews?highlight=${ratingId}`;
        }
        return '/account-reviews';
  
      // 📧 Message → Messagerie
      case NotificationType.MESSAGE_RECEIVED:
        return '/account-messages';
  
      // Par défaut → Page de l'outil
      default:
        if (toolId) {
          return `/listing-tool-detail?id=${toolId}`;
        }
        if (rentalId) {
          return `/tools-management?tab=reserved`;
        }
        return null;
    }
  };

  const handleClick = () => {
    onClick?.();  // ✅ Marque comme lu
    const link = getLink();
    if (link) {
      window.location.href = link;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer relative ${
        !notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {getIcon(notification.type)}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">
              {notification.title}
            </h4>
            
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-500">
              {timeAgo}
            </span>

            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
            )}

            {notification.priority === 'high' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                Urgent
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}