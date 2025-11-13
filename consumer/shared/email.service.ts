import { EmailClient, EmailMessage } from '@azure/communication-email';
import { ServiceBusNotificationPayload, NotificationType } from './types';

export class EmailService {
  private emailClient: EmailClient;
  private fromAddress: string;
  private appUrl: string;

  constructor() {
    if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
      throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING is required');
    }

    if (!process.env.AZURE_EMAIL_FROM_ADDRESS) {
      throw new Error('AZURE_EMAIL_FROM_ADDRESS is required');
    }

    this.emailClient = new EmailClient(
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    );

    this.fromAddress = process.env.AZURE_EMAIL_FROM_ADDRESS;
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentitool.com';

    console.log('📧 [Email Service] Initialized', {
      fromAddress: this.fromAddress,
      appUrl: this.appUrl,
    });
  }

  /**
   * Envoyer un email de notification
   */
  async send(to: string, payload: ServiceBusNotificationPayload): Promise<void> {
    try {
      console.log('📧 [Email Service] Preparing email', {
        to,
        type: payload.type,
        title: payload.title,
      });

      const { subject, html } = this.getEmailTemplate(payload);

      const emailMessage: EmailMessage = {
        senderAddress: this.fromAddress,
        content: {
          subject,
          html,
        },
        recipients: {
          to: [{ address: to }],
        },
      };

      console.log('📤 [Email Service] Sending email...');

      const poller = await this.emailClient.beginSend(emailMessage);
      const result = await poller.pollUntilDone();

      if (result.status === 'Succeeded') {
        console.log('✅ [Email Service] Email sent successfully', {
          to,
          messageId: result.id,
        });
      } else {
        throw new Error(`Email failed with status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('❌ [Email Service] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Générer le template HTML de l'email
   */
  private getEmailTemplate(payload: ServiceBusNotificationPayload): {
    subject: string;
    html: string;
  } {
    const { type, title, message, data } = payload;

    const emoji = this.getEmojiForType(type);
    const color = this.getColorForType(type);

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color)} 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">
                      ${emoji} ${title}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                      ${message}
                    </p>
                    
                    ${this.getTypeSpecificContent(type, data)}
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                      <tr>
                        <td align="center">
                          <a href="${this.appUrl}" style="display: inline-block; padding: 14px 40px; background-color: ${color}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Voir sur RentiTool
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                      © ${new Date().getFullYear()} RentiTool. Tous droits réservés.
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject: title, html };
  }

  /**
   * Contenu spécifique selon le type de notification
   */
  private getTypeSpecificContent(type: NotificationType, data: any): string {
    const cardStyle = 'background-color: #f9f9f9; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;';

    switch (type) {
      case NotificationType.NEW_REVIEW:
        return `
          <div style="${cardStyle}">
            ${data.toolName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📦 Outil :</strong> ${data.toolName}</p>` : ''}
            ${data.reviewerName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>👤 Auteur :</strong> ${data.reviewerName}</p>` : ''}
            ${data.rating ? `<p style="margin: 0; color: #333;"><strong>⭐ Note :</strong> ${'⭐'.repeat(data.rating)} (${data.rating}/5)</p>` : ''}
          </div>
        `;

      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_ACCEPTED:
        return `
          <div style="${cardStyle}">
            ${data.toolName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📦 Outil :</strong> ${data.toolName}</p>` : ''}
            ${data.startDate ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📅 Début :</strong> ${new Date(data.startDate).toLocaleDateString('fr-FR')}</p>` : ''}
            ${data.endDate ? `<p style="margin: 0; color: #333;"><strong>📅 Fin :</strong> ${new Date(data.endDate).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
        `;

      case NotificationType.BOOKING_REJECTED:
      case NotificationType.BOOKING_CANCELLED:
        return `
          <div style="${cardStyle}">
            ${data.toolName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>📦 Outil :</strong> ${data.toolName}</p>` : ''}
            ${data.reason ? `<p style="margin: 0; color: #666;"><strong>Raison :</strong> ${data.reason}</p>` : ''}
          </div>
        `;

      case NotificationType.MESSAGE_RECEIVED:
        return `
          <div style="${cardStyle}">
            ${data.senderName ? `<p style="margin: 0 0 10px 0; color: #333;"><strong>De :</strong> ${data.senderName}</p>` : ''}
            ${data.preview ? `<p style="margin: 0; color: #666; font-style: italic;">"${data.preview}"</p>` : ''}
          </div>
        `;

      default:
        return '';
    }
  }

  /**
   * Obtenir l'emoji selon le type
   */
  private getEmojiForType(type: NotificationType): string {
    const emojiMap: Record<NotificationType, string> = {
      [NotificationType.NEW_REVIEW]: '⭐',
      [NotificationType.REVIEW_REPLY]: '💬',
      [NotificationType.BOOKING_REQUESTED]: '📅',
      [NotificationType.BOOKING_CONFIRMED]: '✅',
      [NotificationType.BOOKING_ACCEPTED]: '🎉',
      [NotificationType.BOOKING_REJECTED]: '❌',
      [NotificationType.BOOKING_CANCELLED]: '🚫',
      [NotificationType.MESSAGE_RECEIVED]: '💌',
      [NotificationType.PAYMENT_RECEIVED]: '💰',
      [NotificationType.TOOL_APPROVED]: '✅',
      [NotificationType.TOOL_REJECTED]: '❌',
    };

    return emojiMap[type] || '🔔';
  }

  /**
   * Obtenir la couleur selon le type
   */
  private getColorForType(type: NotificationType): string {
    const colorMap: Record<NotificationType, string> = {
      [NotificationType.NEW_REVIEW]: '#667eea',
      [NotificationType.REVIEW_REPLY]: '#667eea',
      [NotificationType.BOOKING_REQUESTED]: '#f59e0b',
      [NotificationType.BOOKING_CONFIRMED]: '#10b981',
      [NotificationType.BOOKING_ACCEPTED]: '#10b981',
      [NotificationType.BOOKING_REJECTED]: '#ef4444',
      [NotificationType.BOOKING_CANCELLED]: '#ef4444',
      [NotificationType.MESSAGE_RECEIVED]: '#8b5cf6',
      [NotificationType.PAYMENT_RECEIVED]: '#10b981',
      [NotificationType.TOOL_APPROVED]: '#10b981',
      [NotificationType.TOOL_REJECTED]: '#ef4444',
    };

    return colorMap[type] || '#667eea';
  }

  /**
   * Assombrir une couleur hexadécimale
   */
  private darkenColor(hex: string): string {
    // Simple darkening by reducing RGB values
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 255) - 30);
    const g = Math.max(0, ((num >> 8) & 255) - 30);
    const b = Math.max(0, (num & 255) - 30);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}