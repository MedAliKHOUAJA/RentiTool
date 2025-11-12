// src/lib/resend.ts (fallback provider: Resend d'abord, sinon SendGrid)
import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Resend (prioritaire pour simplicité)
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'; // expéditeur test Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// SendGrid (fallback)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY || '';
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@rentitool.com'; // Adapted for RentiTool domain
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Default recipient override (dev-friendly): sends to aichamaala@gmail.com in non-production
const DEFAULT_TO = process.env.RESEND_DEFAULT_TO || process.env.EMAIL_DEFAULT_TO || ''; // ← Fix: Plus de hardcode, utilise seulement les env vars

// SMTP (fallback final, ex: Gmail via App Password)
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
const SMTP_HOST = process.env.SMTP_HOST || (SMTP_USER ? 'smtp.gmail.com' : '');
const SMTP_PORT = Number(process.env.SMTP_PORT || (SMTP_USER ? '465' : '0'));
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : !!SMTP_USER; // true pour 465
const SMTP_FROM = process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@rentitool.com'; // Adapted for RentiTool
const smtpAvailable = !!(SMTP_USER && SMTP_PASS && SMTP_HOST && SMTP_PORT);
const smtpTransporter = smtpAvailable
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Allow explicit provider selection via env: resend | sendgrid | smtp
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || '').toLowerCase();

const getProvider = (): 'resend' | 'sendgrid' | 'smtp' | null => {
  if (EMAIL_PROVIDER === 'smtp' && smtpTransporter) return 'smtp';
  if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) return 'sendgrid';
  if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) return 'resend';
  // Fallback priority
  if (RESEND_API_KEY) return 'resend';
  if (SENDGRID_API_KEY) return 'sendgrid';
  if (smtpTransporter) return 'smtp';
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

  // Explicit SMTP path
  if (provider === 'smtp' && smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({ from: SMTP_FROM, to: recipient, subject, html });
      return { success: true, data: { messageId: info?.messageId, to: recipient }, error: null };
    } catch (smtpErr: any) {
      console.error('❌ Erreur SMTP:', smtpErr);
      return { success: false, error: smtpErr };
    }
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
            // Si SendGrid échoue, tenter SMTP en dernier recours
            if (smtpTransporter) {
              try {
                const info = await smtpTransporter.sendMail({ from: SMTP_FROM, to: recipient, subject, html });
                return { success: true, data: { messageId: info?.messageId, to: recipient }, error: null };
              } catch (smtpErr: any) {
                console.error('❌ Erreur SMTP (fallback après SendGrid):', smtpErr);
                return { success: false, error: smtpErr };
              }
            }
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
    // Fallback SMTP si disponible
    if (smtpTransporter) {
      try {
        const info = await smtpTransporter.sendMail({ from: SMTP_FROM, to: recipient, subject, html });
        return { success: true, data: { messageId: info?.messageId, to: recipient }, error: null };
      } catch (smtpErr: any) {
        console.error('❌ Erreur SMTP (fallback après SendGrid):', smtpErr);
        return { success: false, error: smtpErr };
      }
    }
    return { success: false, error: errorInfo };
  }
};

// Envoi direct via SMTP si c'est le seul provider disponible
if (!RESEND_API_KEY && !SENDGRID_API_KEY && smtpTransporter) {
  console.log('✉️ SMTP activé comme provider email (fallback).');
}

export const emailTemplates = {
  welcome: (firstName: string, email: string) => {
    return {
      subject: 'Bienvenue sur RentiTool !',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; color: white;">
            <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=RentiTool" alt="RentiTool Logo" style="max-width: 150px; height: auto; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 24px;">Bienvenue, ${firstName} !</h1>
            <p style="margin: 0; opacity: 0.95;">Rejoignez la communauté des location d'outils</p>
          </div>
          <div style="padding: 30px;">
            <p>Merci de vous être inscrit sur <strong>RentiTool</strong> avec l'email ${email}.</p>
            <p>Découvrez des outils de qualité à louer près de chez vous, en toute simplicité et sécurité.</p>
            <a href="http://localhost:3000/login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Commencer à louer</a>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 12px 12px;">
            © 2025 RentiTool – Location d'outils simplifiée
          </div>
        </div>
      `,
    };
  },
  loginNotification: (firstName: string, email: string, when: string, ip?: string, location?: string) => { // ← Ajout du paramètre 'location'
    const safeName = firstName || 'Utilisateur';
    const ipInfo = ip ? `<p style="font-size: 12px; color: #6b7280;">Adresse IP: ${ip}</p>` : '';
    const locationInfo = location && location !== 'Localisation inconnue'
      ? `<p style="font-size: 14px; color: #059669; font-weight: bold; margin: 8px 0;">📍 Localisation: ${location}</p>` // ← Affichage de la localisation
      : ''; // Skip si inconnue
   
    return {
      subject: '🛡️ Nouvelle connexion détectée sur votre compte RentiTool', // ← Sujet mis à jour pour plus d'impact
      html: `
        <!DOCTYPE html>
        <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="fr">
          <head>
            <title>Nouvelle connexion RentiTool</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; }
              a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
              #MessageViewBody a { color: inherit; text-decoration: none; }
              p { line-height: 1.5; }
              .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
              .image_block img+div { display: none; }
              sup, sub { font-size: 75%; line-height: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
              .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
              .content { padding: 30px; }
              .alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
              .btn:hover { background: #2563eb !important; }
              @media (max-width: 600px) {
                .container { width: 100% !important; border-radius: 0; }
                .content { padding: 20px !important; }
                .header { padding: 20px !important; }
                .btn { width: 100%; text-align: center; box-sizing: border-box; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://via.placeholder.com/150x50/3b82f6/ffffff?text=RentiTool" alt="RentiTool Logo">
                <h1 style="margin: 0; font-size: 24px;">Bonjour, ${safeName} !</h1>
                <p style="margin: 0; opacity: 0.9;">Votre sécurité est notre priorité</p>
              </div>
              <div class="content">
                <div class="alert">
                  <strong>🛡️ Activité récente sur RentiTool :</strong><br>
                  Une connexion à votre compte (${email}) a été détectée depuis un appareil de location d'outils.
                </div>
                <p><strong>Date et heure :</strong> ${when}</p>
                ${locationInfo}
                ${ipInfo}
                <p style="color: #374151;">Si c'était bien vous, continuez à louer en toute confiance ! Sinon, <strong>changez immédiatement votre mot de passe</strong> et contactez le support RentiTool.</p>
                <br>
                <a href="http://localhost:3000/profile" class="btn">🔒 Sécuriser mon compte</a>
                <br><br>
                <p style="font-size: 14px; color: #6b7280;">Besoin d'aide pour une location ? <a href="mailto:support@rentitool.com" style="color: #3b82f6;">support@rentitool.com</a></p>
              </div>
              <div class="footer">
                Cet email est automatique. Merci de ne pas y répondre.<br>
                © 2025 RentiTool – Louez malin, partout en Tunisie
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
  // Vous pouvez ajouter d'autres templates ici (ex: reset password)
};