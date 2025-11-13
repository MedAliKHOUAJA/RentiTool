import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

// Resend (prioritaire pour simplicité)
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'; // expéditeur test Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// SendGrid (fallback)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@votredomaine.com';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Default recipient override (dev-friendly): sends to aichamaala@gmail.com in non-production
const DEFAULT_TO = process.env.RESEND_DEFAULT_TO || process.env.EMAIL_DEFAULT_TO || (process.env.NODE_ENV !== 'production' ? 'aichamaala@gmail.com' : '');

const getProvider = (): 'resend' | 'sendgrid' | null => {
  if (RESEND_API_KEY) return 'resend';
  if (SENDGRID_API_KEY) return 'sendgrid';
  return null;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  const recipient = DEFAULT_TO || to;
  const provider = getProvider();
  if (!provider) {
    console.error('❌ Aucun provider email configuré. Définissez RESEND_API_KEY ou SENDGRID_API_KEY.');
    return { success: false, error: 'NO_EMAIL_PROVIDER' };
  }

  if (provider === 'resend' && resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM, // Onboarding fonctionne sans domaine vérifié
        to: recipient,
        subject,
        html,
      });
      if (error) {
        console.error('❌ Erreur Resend:', error);
        // Si Resend bloque les envois test (403 validation_error), basculer automatiquement sur SendGrid
        const isTestRestriction = (error as any)?.statusCode === 403 && (error as any)?.name === 'validation_error';
        if (isTestRestriction && SENDGRID_API_KEY) {
          try {
            const msg = { to: recipient, from: SENDGRID_FROM, subject, html };
            const [response] = await sgMail.send(msg);
            return { success: true, data: { statusCode: response?.statusCode, to: recipient }, error: null };
          } catch (sgErr: any) {
            const errorInfo = sgErr?.response?.body || sgErr;
            console.error('❌ Erreur SendGrid (fallback après Resend):', errorInfo);
            return { success: false, error: errorInfo };
          }
        }
      }
      return { success: !error, data, error };
    } catch (err) {
      console.error('❌ Erreur Resend (catch):', err);
      return { success: false, error: err };
    }
  }

  // Fallback SendGrid
  try {
    const msg = { to: recipient, from: SENDGRID_FROM, subject, html };
    const [response] = await sgMail.send(msg);
    return { success: true, data: { statusCode: response?.statusCode, to: recipient } };
  } catch (err: any) {
    const errorInfo = err?.response?.body || err;
    console.error('❌ Erreur SendGrid:', errorInfo);
    return { success: false, error: errorInfo };
  }
};

export const emailTemplates = {
  welcome: (firstName: string, email: string) => {
    return {
      subject: 'Bienvenue sur Notre App !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bienvenue, ${firstName} !</h2>
          <p>Merci de vous être inscrit sur Notre App avec l'email ${email}.</p>
          <p>Vous pouvez maintenant vous connecter et explorer nos fonctionnalités.</p>
          <a href="https://votreapp.com/login" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a>
          <p style="font-size: 12px; color: #999;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      `,
    };
  },
  loginNotification: (firstName: string, email: string, when: string, ip?: string) => {
    const safeName = firstName || 'Utilisateur';
    const ipInfo = ip ? `<p style="font-size: 12px; color: #666;">Adresse IP: ${ip}</p>` : '';
    return {
      subject: 'Connexion à votre compte RentiTool',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bonjour, ${safeName}</h2>
          <p>Une connexion à votre compte (${email}) a été effectuée.</p>
          <p><strong>Date et heure:</strong> ${when}</p>
          ${ipInfo}
          <p style="margin-top: 16px;">Si ce n'était pas vous, changez votre mot de passe et contactez le support.</p>
          <a href="https://votreapp.com/profile" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Voir mon profil</a>
          <p style="font-size: 12px; color: #999; margin-top: 16px;">Cet email est automatique. Merci de ne pas y répondre.</p>
        </div>
      `,
    };
  },
  resetPassword: (firstName: string, resetUrl: string, email: string) => {
    return {
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bonjour ${firstName},</h2>
          <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
          <p style="font-size: 12px; color: #999;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    };
  },
};