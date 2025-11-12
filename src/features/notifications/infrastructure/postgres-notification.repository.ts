import { query } from '@/db';
import {
  Notification,
  NotificationPreferences,
  CreateNotificationDto,
} from '../domain/notification.types';
import { NotificationRepository } from '../domain/notification.repository';

export class PostgresNotificationRepository implements NotificationRepository {
  // ==========================================
  // NOTIFICATIONS CRUD
  // ==========================================

  /**
   * Créer une notification
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    console.log('📝 [NotificationRepo] Creating notification:', dto.type);

    const result = await query(
      `INSERT INTO "Notifications" (
        "UserId", "Type", "Title", "Message", "Data", "Priority",
        "ToolId", "RentalId", "RatingId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        "NotificationId" as "notificationId",
        "UserId" as "userId",
        "Type" as "type",
        "Title" as "title",
        "Message" as "message",
        "Data" as "data",
        "IsRead" as "isRead",
        "ReadAt" as "readAt",
        "CreatedAt" as "createdAt",
        "Priority" as "priority",
        "ToolId" as "toolId",
        "RentalId" as "rentalId",
        "RatingId" as "ratingId"`,
      [
        dto.userId,
        dto.type,
        dto.title,
        dto.message,
        dto.data ? JSON.stringify(dto.data) : null,
        dto.priority || 'medium',
        dto.toolId || null,
        dto.rentalId || null,
        dto.ratingId || null,
      ]
    );

    console.log('✅ [NotificationRepo] Notification created:', result.rows[0].notificationId);
    return result.rows[0];
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async findByUserId(
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean; offset?: number }
  ): Promise<Notification[]> {
    console.log('📥 [NotificationRepo] Fetching notifications for user:', userId);
    console.log('📊 [NotificationRepo] Options:', options); // ✅ AJOUT
  
    let sql = `
      SELECT 
        "NotificationId" as "notificationId",
        "UserId" as "userId",
        "Type" as "type",
        "Title" as "title",
        "Message" as "message",
        "Data" as "data",
        "IsRead" as "isRead",
        "ReadAt" as "readAt",
        "CreatedAt" as "createdAt",
        "Priority" as "priority",
        "ToolId" as "toolId",
        "RentalId" as "rentalId",
        "RatingId" as "ratingId"
      FROM "Notifications"
      WHERE "UserId" = $1
    `;
  
    const params: any[] = [userId];
  
    if (options?.unreadOnly) {
      sql += ` AND "IsRead" = FALSE`;
    }
  
    sql += ` ORDER BY "CreatedAt" DESC`;
  
    if (options?.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
  
    if (options?.offset) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }
  
    console.log('🔍 [NotificationRepo] SQL:', sql); // ✅ AJOUT
    console.log('🔍 [NotificationRepo] Params:', params); // ✅ AJOUT
  
    const result = await query(sql, params);
    
    console.log('✅ [NotificationRepo] Found', result.rows.length, 'notifications');
    
    return result.rows;
  }

  /**
   * Récupérer une notification par ID
   */
  async findById(notificationId: number): Promise<Notification | null> {
    console.log('🔍 [NotificationRepo] Finding notification by ID:', notificationId);

    const result = await query(
      `SELECT 
        "NotificationId" as "notificationId",
        "UserId" as "userId",
        "Type" as "type",
        "Title" as "title",
        "Message" as "message",
        "Data" as "data",
        "IsRead" as "isRead",
        "ReadAt" as "readAt",
        "CreatedAt" as "createdAt",
        "Priority" as "priority",
        "ToolId" as "toolId",
        "RentalId" as "rentalId",
        "RatingId" as "ratingId"
      FROM "Notifications"
      WHERE "NotificationId" = $1`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      console.log('⚠️ [NotificationRepo] Notification not found');
      return null;
    }

    console.log('✅ [NotificationRepo] Notification found');
    return result.rows[0];
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: number): Promise<void> {
    console.log('✓ [NotificationRepo] Marking notification as read:', notificationId);

    await query(
      `UPDATE "Notifications" 
       SET "IsRead" = TRUE, "ReadAt" = CURRENT_TIMESTAMP
       WHERE "NotificationId" = $1`,
      [notificationId]
    );

    console.log('✅ [NotificationRepo] Notification marked as read');
  }

  /**
   * Marquer toutes les notifications comme lues pour un utilisateur
   */
  async markAllAsRead(userId: string): Promise<void> {
    console.log('✓ [NotificationRepo] Marking all notifications as read for user:', userId);

    const result = await query(
      `UPDATE "Notifications" 
       SET "IsRead" = TRUE, "ReadAt" = CURRENT_TIMESTAMP
       WHERE "UserId" = $1 AND "IsRead" = FALSE
       RETURNING "NotificationId"`,
      [userId]
    );

    console.log('✅ [NotificationRepo] Marked', result.rows.length, 'notifications as read');
  }

  /**
   * Compter les notifications non lues
   */
  async countUnread(userId: string): Promise<number> {
    console.log('🔢 [NotificationRepo] Counting unread notifications for user:', userId);

    const result = await query(
      `SELECT COUNT(*) as count 
       FROM "Notifications" 
       WHERE "UserId" = $1 AND "IsRead" = FALSE`,
      [userId]
    );

    const count = parseInt(result.rows[0].count, 10);
    console.log('✅ [NotificationRepo] Unread count:', count);
    
    return count;
  }

  /**
   * Supprimer une notification
   */
  async delete(notificationId: number): Promise<void> {
    console.log('🗑️ [NotificationRepo] Deleting notification:', notificationId);

    await query(
      `DELETE FROM "Notifications" WHERE "NotificationId" = $1`,
      [notificationId]
    );

    console.log('✅ [NotificationRepo] Notification deleted');
  }

  /**
   * Supprimer toutes les notifications d'un utilisateur
   */
  async deleteAllForUser(userId: string): Promise<void> {
    console.log('🗑️ [NotificationRepo] Deleting all notifications for user:', userId);

    const result = await query(
      `DELETE FROM "Notifications" 
       WHERE "UserId" = $1
       RETURNING "NotificationId"`,
      [userId]
    );

    console.log('✅ [NotificationRepo] Deleted', result.rows.length, 'notifications');
  }

  // ==========================================
  // PRÉFÉRENCES
  // ==========================================

  /**
   * Récupérer les préférences de notification d'un utilisateur
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    console.log('⚙️ [NotificationRepo] Getting preferences for user:', userId);

    const result = await query(
      `SELECT 
        "PreferenceId" as "preferenceId",
        "UserId" as "userId",
        "EnableInApp" as "enableInApp",
        "EnableEmail" as "enableEmail",
        "EnablePush" as "enablePush",
        "NotifyOnReviewReply" as "notifyOnReviewReply",
        "NotifyOnNewReview" as "notifyOnNewReview",
        "NotifyOnBookingConfirmed" as "notifyOnBookingConfirmed",
        "NotifyOnBookingCancelled" as "notifyOnBookingCancelled",
        "NotifyOnMessageReceived" as "notifyOnMessageReceived",
        "UpdatedAt" as "updatedAt"
       FROM "NotificationPreferences"
       WHERE "UserId" = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log('⚠️ [NotificationRepo] No preferences found');
      return null;
    }

    console.log('✅ [NotificationRepo] Preferences found');
    return result.rows[0];
  }

  /**
   * Créer les préférences par défaut pour un utilisateur
   */
  async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    console.log('➕ [NotificationRepo] Creating default preferences for user:', userId);

    const result = await query(
      `INSERT INTO "NotificationPreferences" ("UserId")
       VALUES ($1)
       ON CONFLICT ("UserId") DO UPDATE 
       SET "UpdatedAt" = CURRENT_TIMESTAMP
       RETURNING 
        "PreferenceId" as "preferenceId",
        "UserId" as "userId",
        "EnableInApp" as "enableInApp",
        "EnableEmail" as "enableEmail",
        "EnablePush" as "enablePush",
        "NotifyOnReviewReply" as "notifyOnReviewReply",
        "NotifyOnNewReview" as "notifyOnNewReview",
        "NotifyOnBookingConfirmed" as "notifyOnBookingConfirmed",
        "NotifyOnBookingCancelled" as "notifyOnBookingCancelled",
        "NotifyOnMessageReceived" as "notifyOnMessageReceived",
        "UpdatedAt" as "updatedAt"`,
      [userId]
    );

    console.log('✅ [NotificationRepo] Default preferences created');
    return result.rows[0];
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'userId' | 'preferenceId' | 'updatedAt'>>
  ): Promise<void> {
    console.log('🔄 [NotificationRepo] Updating preferences for user:', userId);

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Mapping camelCase vers snake_case pour les colonnes SQL
    const fieldMap: Record<string, string> = {
      enableInApp: 'EnableInApp',
      enableEmail: 'EnableEmail',
      enablePush: 'EnablePush',
      notifyOnReviewReply: 'NotifyOnReviewReply',
      notifyOnNewReview: 'NotifyOnNewReview',
      notifyOnBookingConfirmed: 'NotifyOnBookingConfirmed',
      notifyOnBookingCancelled: 'NotifyOnBookingCancelled',
      notifyOnMessageReceived: 'NotifyOnMessageReceived',
    };

    Object.entries(preferences).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        fields.push(`"${fieldMap[key]}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      console.log('⚠️ [NotificationRepo] No fields to update');
      return;
    }

    values.push(userId);

    await query(
      `UPDATE "NotificationPreferences"
       SET ${fields.join(', ')}, "UpdatedAt" = CURRENT_TIMESTAMP
       WHERE "UserId" = $${paramIndex}`,
      values
    );

    console.log('✅ [NotificationRepo] Preferences updated');
  }

  // ==========================================
  // MÉTHODES STUB (pour respecter l'interface)
  // ==========================================

  /**
   * Sauvegarder un token push (non implémenté pour l'instant)
   */
  async savePushToken(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android' | 'web',
    deviceId?: string
  ): Promise<void> {
    console.log('⚠️ [NotificationRepo] savePushToken not implemented yet');
    // TODO: Implémenter quand la table PushTokens sera créée
  }

  /**
   * Récupérer les tokens push (non implémenté pour l'instant)
   */
  async getPushTokens(userId: string): Promise<any[]> {
    console.log('⚠️ [NotificationRepo] getPushTokens not implemented yet');
    // TODO: Implémenter quand la table PushTokens sera créée
    return [];
  }

  /**
   * Désactiver un token push (non implémenté pour l'instant)
   */
  async deactivatePushToken(token: string): Promise<void> {
    console.log('⚠️ [NotificationRepo] deactivatePushToken not implemented yet');
    // TODO: Implémenter quand la table PushTokens sera créée
  }

  /**
   * Logger une notification (non implémenté pour l'instant)
   */
  async logNotification(
    notificationId: number,
    channel: any,
    status: any,
    error?: string
  ): Promise<void> {
    console.log('⚠️ [NotificationRepo] logNotification not implemented yet');
    // TODO: Implémenter quand la table NotificationLogs sera créée
  }

  /**
   * Récupérer les logs (non implémenté pour l'instant)
   */
  async getLogs(notificationId: number): Promise<any[]> {
    console.log('⚠️ [NotificationRepo] getLogs not implemented yet');
    // TODO: Implémenter quand la table NotificationLogs sera créée
    return [];
  }
}