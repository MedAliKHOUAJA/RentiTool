// src/lib/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY non défini');
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Votre App <no-reply@votredomaine.com>', // Remplacez par votre email vérifié sur Resend
      to,
      subject,
      html,
    });

    return { success: !error, data, error };
  } catch (err) {
    console.error('❌ Erreur Resend:', err);
    return { success: false, error: err };
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
  // Vous pouvez ajouter d'autres templates ici (ex: reset password)
};