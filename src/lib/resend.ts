import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Resend (prioritaire)
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// SendGrid (fallback)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@rentitool.com'; // Mise à jour domaine
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// SMTP (prioritaire si configuré)
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '0', 10);
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_USERNAME || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const SMTP_SECURE = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@rentitool.com';
const smtpTransport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || (SMTP_SECURE ? 465 : 587),
      secure: SMTP_SECURE || (SMTP_PORT === 465),
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

// Default TO pour dev (Resend test mode: envoi autorisé seulement vers l'email propriétaire)
const RESEND_TEST_TO = process.env.RESEND_TEST_TO || 'aicha.maala@esprit.tn';
const DEFAULT_TO = process.env.RESEND_DEFAULT_TO || process.env.EMAIL_DEFAULT_TO || (process.env.NODE_ENV !== 'production' ? RESEND_TEST_TO : '');

const getProvider = (): 'smtp' | 'resend' | 'sendgrid' | null => {
  if (smtpTransport) return 'smtp';
  if (RESEND_API_KEY) return 'resend';
  if (SENDGRID_API_KEY) return 'sendgrid';
  return null;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  const provider = getProvider();
  const recipient = provider === 'resend' ? (DEFAULT_TO || to) : to;
  if (!provider) {
    console.error('❌ Aucun provider email configuré.');
    return { success: false, error: 'NO_EMAIL_PROVIDER' };
  }

  console.log(`📧 Envoi email à ${recipient} via ${provider} | Sujet: ${subject}`);

  // SMTP prioritaire
  if (provider === 'smtp' && smtpTransport) {
    try {
      const info = await smtpTransport.sendMail({
        from: SMTP_FROM,
        to: recipient,
        subject,
        html,
      });
      console.log('✅ SMTP succès:', info.messageId);
      return { success: true, data: { messageId: info.messageId, to: recipient }, error: null };
    } catch (smtpErr) {
      console.error('❌ Erreur SMTP:', smtpErr);
      // Si SMTP échoue, tenter Resend puis SendGrid selon config
    }
  }

  if (provider === 'resend' && resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: recipient,
        subject,
        html,
      });
      if (error) {
        console.error('❌ Erreur Resend:', error);
        // Si Resend bloque les envois tests (403 validation_error), rediriger vers l'email propriétaire
        const isTestRestriction = (error as any)?.statusCode === 403 && (error as any)?.name === 'validation_error';
        if (isTestRestriction) {
          console.log('🔄 Restriction Resend (test mode) – redirection vers:', RESEND_TEST_TO);
          try {
            const { data: data2, error: error2 } = await resend.emails.send({
              from: RESEND_FROM,
              to: RESEND_TEST_TO,
              subject: `[DEV REDIR] ${subject}`,
              html: `${html}<p style=\"font-size:12px;color:#666;margin-top:12px\">Destinataire original: ${recipient}</p>`,
            });
            if (!error2) {
              console.log('✅ Resend redirection dev succès:', data2);
              return { success: true, data: data2, error: null };
            }
            console.error('❌ Erreur Resend lors de la redirection dev:', error2);
          } catch (redirErr) {
            console.error('❌ Erreur Resend (catch) lors de la redirection dev:', redirErr);
          }
          // Fallback SendGrid vers l'email de test si configuré
          if (SENDGRID_API_KEY) {
            console.log('🔄 Fallback SendGrid après échec redirection Resend');
            try {
              const msg = { to: RESEND_TEST_TO, from: SENDGRID_FROM, subject: `[DEV REDIR] ${subject}`, html: `${html}<p><strong>Destinataire original:</strong> ${recipient}</p>` };
              const [response] = await sgMail.send(msg);
              console.log('✅ SendGrid fallback (redir dev) succès:', response?.statusCode);
              return { success: true, data: { statusCode: response?.statusCode, to: RESEND_TEST_TO }, error: null };
            } catch (sgErr: any) {
              const errorInfo = sgErr?.response?.body || sgErr;
              console.error('❌ Erreur SendGrid (fallback après Resend, redir dev):', errorInfo);
              return { success: false, error: errorInfo };
            }
          }
          // Si aucune redirection/fallback n'a réussi
          return { success: false, error };
        }
        // Autres erreurs: essayer SendGrid si disponible
        if (SENDGRID_API_KEY) {
          console.log('🔄 Fallback sur SendGrid après erreur Resend');
          try {
            const msg = { to: recipient, from: SENDGRID_FROM, subject, html };
            const [response] = await sgMail.send(msg);
            console.log('✅ SendGrid fallback succès:', response?.statusCode);
            return { success: true, data: { statusCode: response?.statusCode, to: recipient }, error: null };
          } catch (sgErr: any) {
            const errorInfo = sgErr?.response?.body || sgErr;
            console.error('❌ Erreur SendGrid fallback:', errorInfo);
            return { success: false, error: errorInfo };
          }
        }
        return { success: false, error };
      }
      console.log('✅ Resend succès:', data);
      return { success: true, data, error: null };
    } catch (err) {
      console.error('❌ Erreur Resend (catch):', err);
      return { success: false, error: err };
    }
  }

  // Fallback SendGrid direct
  try {
    const msg = { to: recipient, from: SENDGRID_FROM, subject, html };
    const [response] = await sgMail.send(msg);
    console.log('✅ SendGrid succès:', response?.statusCode);
    return { success: true, data: { statusCode: response?.statusCode, to: recipient } };
  } catch (err: any) {
    const errorInfo = err?.response?.body || err;
    console.error('❌ Erreur SendGrid:', errorInfo);
    return { success: false, error: errorInfo };
  }
};

// Templates mis à jour avec URLs correctes (utilisez NEXT_PUBLIC_APP_URL dans .env)
export const emailTemplates = {
  welcome: (firstName: string, email: string) => {
    return {
      subject: 'Bienvenue sur RentiTool !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bienvenue, ${firstName} !</h2>
          <p>Merci de vous être inscrit sur RentiTool avec l'email ${email}.</p>
          <p>Vous pouvez maintenant vous connecter et explorer nos fonctionnalités.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a>
          <p style="font-size: 12px; color: #999;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      `,
    };
  },
  loginNotification: (firstName: string, email: string, when: string, ip?: string, location?: string) => {
    const safeName = firstName || 'Utilisateur';
    const ipInfo = ip ? `<p style="font-size: 12px; color: #666;">Adresse IP: ${ip}</p>` : '';
    const locationInfo = location ? `<p style="font-size: 12px; color: #666;">Localisation: ${location}</p>` : '';
    return {
      subject: 'Connexion à votre compte RentiTool',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bonjour, ${safeName}</h2>
          <p>Une connexion à votre compte (${email}) a été effectuée.</p>
          <p><strong>Date et heure:</strong> ${when}</p>
          ${ipInfo}
          ${locationInfo}
          <p style="margin-top: 16px;">Si ce n'était pas vous, changez votre mot de passe et contactez le support.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Voir mon profil</a>
          <p style="font-size: 12px; color: #999; margin-top: 16px;">Cet email est automatique. Merci de ne pas y répondre.</p>
        </div>
      `,
    };
  },
  resetPassword: (firstName: string, resetUrl: string, email: string) => {
    const safeName = firstName || 'Utilisateur';
    return {
      subject: 'Réinitialisation de votre mot de passe RentiTool',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Bonjour, ${safeName}</h2>
          <p>Vous avez demandé à réinitialiser le mot de passe de votre compte (${email}).</p>
          <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans une heure.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Réinitialiser mon mot de passe</a>
          <p style="font-size: 12px; color: #999; margin-top: 16px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    };
  },
};