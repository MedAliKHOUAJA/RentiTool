// src/lib/resend.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Si pas de clé API, simuler l'envoi
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [SIMULATION] Email à:', to);
      console.log('📧 [SIMULATION] Sujet:', subject);
      return { success: true, data: { id: 'simulated' } };
    }

    // 🔥 ESSAI : Utiliser votre email ESPRIT comme expéditeur
    const { data, error } = await resend.emails.send({
      from: 'RentiTool <aichamaala@esprit.tn>', // 🔥 Votre email ESPRIT
      to: to, // N'importe quelle adresse
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Erreur envoi email:', error);
      
      // Si échec, essayer avec l'expéditeur par défaut mais rediriger vers votre email
      if (error.statusCode === 403) {
        console.log('🔄 Essai avec expéditeur Resend...');
        return await sendEmailWithResendSender(to, subject, html);
      }
      
      return { success: false, error };
    }

    console.log('✅ Email envoyé de aichamaala@esprit.tn à:', to);
    return { success: true, data };
  } catch (error) {
    console.error('💥 Erreur email:', error);
    return { success: false, error };
  }
};

// Fonction de fallback avec expéditeur Resend
const sendEmailWithResendSender = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'RentiTool <onboarding@resend.dev>',
      to: 'aichamaala@esprit.tn', // 🔥 Toujours envoyer à votre email
      subject: `[REDIRIGÉ] ${subject} - Destinataire original: ${to}`,
      html: html + `<p><strong>Destinataire original:</strong> ${to}</p>`,
    });

    if (error) throw error;
    
    console.log('📧 Email redirigé vers aichamaala@esprit.tn (destinataire original:', to, ')');
    return { success: true, data, redirected: true };
  } catch (fallbackError) {
    console.error('❌ Erreur même avec fallback:', fallbackError);
    return { success: false, error: fallbackError };
  }
};