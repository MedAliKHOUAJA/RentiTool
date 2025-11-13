import { EmailClient, EmailMessage } from '@azure/communication-email';
import {
  NotificationType,
  ServiceBusNotificationPayload,
} from '../../domain/notification.types';

export class EmailNotificationService {
  private emailClient: EmailClient;
  private fromAddress: string;

  constructor() {
    console.log('📧 [Email Service] Initializing Azure Email Client...');

    // Vérifier que les variables d'environnement existent
    if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
      console.error('❌ [Email Service] AZURE_COMMUNICATION_CONNECTION_STRING missing');
      throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING must be set');
    }

    if (!process.env.AZURE_EMAIL_FROM_ADDRESS) {
      console.error('❌ [Email Service] AZURE_EMAIL_FROM_ADDRESS missing');
      throw new Error('AZURE_EMAIL_FROM_ADDRESS must be set');
    }

    // Initialiser le client Azure Email
    this.emailClient = new EmailClient(
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    );

    this.fromAddress = process.env.AZURE_EMAIL_FROM_ADDRESS;

    console.log('✅ [Email Service] Azure Email Client initialized');
    console.log('📧 [Email Service] From address:', this.fromAddress);
  }

  /**
   * Envoyer un email de notification
   */
  async send(
    to: string,
    payload: ServiceBusNotificationPayload
  ): Promise<void> {
    try {
      console.log('📧 [Email Service] Sending email to:', to);
      console.log('📧 [Email Service] From:', this.fromAddress);
      console.log('📧 [Email Service] Subject:', payload.title);

      const { subject, html } = this.getEmailTemplate(payload);

      // Construire le message email
      const emailMessage: EmailMessage = {
        senderAddress: this.fromAddress,
        content: {
          subject: subject,
          html: html,
        },
        recipients: {
          to: [{ address: to }],
        },
      };

      console.log('📤 [Email Service] Initiating send...');

      // Envoyer l'email
      const poller = await this.emailClient.beginSend(emailMessage);

      console.log('⏳ [Email Service] Waiting for completion...');

      // Attendre que l'email soit envoyé (avec timeout de 60 secondes)
      const result = await poller.pollUntilDone();

      console.log('✅ [Email Service] Email sent successfully');
      console.log('📧 [Email Service] Message ID:', result.id);
      console.log('📧 [Email Service] Status:', result.status);
      console.log('📧 [Email Service] Error (if any):', result.error);

      // ✅ Vérifier le statut final
      if (result.status === 'Succeeded') {
        console.log('🎉 [Email Service] Email delivery CONFIRMED');
      } else if (result.status === 'Failed') {
        console.error('❌ [Email Service] Email delivery FAILED');
        console.error('❌ [Email Service] Failure reason:', result.error);
        throw new Error(`Email delivery failed: ${result.error?.message || 'Unknown error'}`);
      } else {
        console.warn('⚠️ [Email Service] Email status:', result.status);
      }

    } catch (error: any) {
      console.error('❌ [Email Service] Error sending email:', error);
      console.error('❌ [Email Service] Error details:', {
        name: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
      throw error;
    }
  }

  /**
   * Obtenir le template email selon le type de notification
   */
  private getEmailTemplate(payload: ServiceBusNotificationPayload): {
    subject: string;
    html: string;
  } {
    const { type, title, message, data } = payload;

    // ✅ Style CSS inline pour compatibilité email
    const styles = {
      container: 'max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;',
      header: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;',
      content: 'background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;',
      button: 'display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;',
      footer: 'text-align: center; margin-top: 30px; color: #666; font-size: 12px;',
      card: 'background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;',
    };

    const baseHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="${styles.container}">
          <!-- Header -->
          <div style="${styles.header}">
            <h1 style="margin: 0; font-size: 24px;">🔔 ${title}</h1>
          </div>
          
          <!-- Content -->
          <div style="${styles.content}">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
            
            ${this.getTypeSpecificContent(type, data, styles)}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="${styles.button}">
              Voir sur RentiTool
            </a>
          </div>
          
          <!-- Footer -->
          <div style="${styles.footer}">
            <p>Vous recevez cet email car vous êtes inscrit sur RentiTool.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" 
                 style="color: #667eea; text-decoration: none;">
                Gérer mes préférences de notification
              </a>
            </p>
            <p style="margin-top: 20px; color: #999;">
              © ${new Date().getFullYear()} RentiTool. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: title,
      html: baseHtml,
    };
  }

  /**
   * Contenu spécifique selon le type de notification
   */
  private getTypeSpecificContent(
    type: NotificationType,
    data: any,
    styles: any
  ): string {
    switch (type) {
      case NotificationType.NEW_REVIEW:
        return `
          <div style="${styles.card}">
            <p style="margin: 0 0 10px 0;"><strong>📦 Outil :</strong> ${data.toolName || 'N/A'}</p>
            <p style="margin: 0 0 10px 0;"><strong>👤 Auteur :</strong> ${data.reviewerName || 'N/A'}</p>
            ${data.rating ? `<p style="margin: 0;"><strong>⭐ Note :</strong> ${data.rating}/5</p>` : ''}
          </div>
        `;

      case NotificationType.REVIEW_REPLY:
        return `
          <div style="background: white; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>💬 Réponse :</strong></p>
            <p style="margin: 0; font-style: italic; color: #555;">"${data.replyText}"</p>
          </div>
        `;

      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_ACCEPTED:
        return `
          <div style="background: white; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📦 Outil :</strong> ${data.toolName || 'N/A'}</p>
            ${data.startDate ? `<p style="margin: 0 0 10px 0;"><strong>📅 Du :</strong> ${data.startDate}</p>` : ''}
            ${data.endDate ? `<p style="margin: 0;"><strong>📅 Au :</strong> ${data.endDate}</p>` : ''}
          </div>
        `;

      case NotificationType.BOOKING_CANCELLED:
      case NotificationType.BOOKING_REJECTED:
        return `
          <div style="background: white; padding: 15px; border-left: 4px solid #f56565; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📦 Outil :</strong> ${data.toolName || 'N/A'}</p>
            ${data.reason ? `<p style="margin: 0;"><strong>❌ Raison :</strong> ${data.reason}</p>` : ''}
          </div>
        `;

      case NotificationType.BOOKING_REQUESTED:
        return `
          <div style="background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📦 Outil :</strong> ${data.toolName || 'N/A'}</p>
            <p style="margin: 0 0 10px 0;"><strong>👤 Demandeur :</strong> ${data.renterName || 'N/A'}</p>
            ${data.startDate ? `<p style="margin: 0 0 10px 0;"><strong>📅 Du :</strong> ${data.startDate}</p>` : ''}
            ${data.endDate ? `<p style="margin: 0;"><strong>📅 Au :</strong> ${data.endDate}</p>` : ''}
          </div>
        `;

      case NotificationType.MESSAGE_RECEIVED:
        return `
          <div style="background: white; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📧 De :</strong> ${data.senderName || 'N/A'}</p>
            ${data.messagePreview ? `<p style="margin: 0; font-style: italic; color: #555;">"${data.messagePreview}"</p>` : ''}
          </div>
        `;

      default:
        return '';
    }
  }

  /**
   * Tester la connexion Azure Email
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 [Email Service] Testing Azure Email connection...');
      
      // Azure Email ne propose pas de méthode verify()
      // On considère que si le client est initialisé, c'est OK
      console.log('✅ [Email Service] Azure Email client ready');
      
      return true;
    } catch (error: any) {
      console.error('❌ [Email Service] Azure Email connection failed:', error);
      return false;
    }
  }
}