import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/features/notifications/application/services/email-notification.service';
import { NotificationType, NotificationPriority, NotificationChannel } from '@/features/notifications/domain/notification.types';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test Email] Starting Azure Email test...');

    const emailService = new EmailNotificationService();

    // Test de connexion
    const isConnected = await emailService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Azure Email client initialization failed' },
        { status: 500 }
      );
    }

    // ✅ Récupérer l'email de test depuis la query
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@example.com';

    console.log('📧 [Test Email] Sending to:', testEmail);

    // Payload de test
    const testPayload = {
      type: NotificationType.NEW_REVIEW,
      recipientUserId: 'test-user-id',
      title: '🎉 Test Azure Communication Services Email',
      message: 'Ceci est un email de test envoyé depuis RentiTool via Azure Communication Services. Si vous recevez cet email, la configuration fonctionne parfaitement !',
      data: {
        toolName: 'Perceuse électrique Bosch',
        reviewerName: 'Jean Dupont',
        rating: 5,
        notificationId: 1,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL],
      },
    };

    // ✅ MODIFICATION : Capturer le résultat détaillé
    console.log('📤 [Test Email] Attempting to send email...');
    
    await emailService.send(testEmail, testPayload);

    console.log('✅ [Test Email] Email sent successfully via Azure');

    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès via Azure Communication Services ! 🎉',
      recipient: testEmail,
      provider: 'Azure Communication Services',
      note: 'Vérifiez votre boîte de réception et votre dossier SPAM. Les emails Azure peuvent prendre quelques minutes.',
      fromAddress: process.env.AZURE_EMAIL_FROM_ADDRESS,
    });
  } catch (error: any) {
    console.error('❌ [Test Email] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error.message,
        code: error.code,
        statusCode: error.statusCode,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}