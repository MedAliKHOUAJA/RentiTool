// src/lib/sms.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
  console.error('❌ Configuration Twilio manquante');
}

const client = twilio(accountSid, authToken);

export const sendSMS = async (
  to: string,
  message: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Nettoyer le numéro de téléphone (retirer espaces, +, etc.)
    const cleanNumber = to.replace(/\s/g, '').replace(/\+/g, '');
    
    // S'assurer que le numéro commence par +
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;
    
    console.log('📱 Envoi SMS à:', formattedNumber);
    
    const sms = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber,
    });
    
    console.log('✅ SMS envoyé avec succès. SID:', sms.sid);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    return { success: false, error };
  }
};

export const smsTemplates = {
  loginNotification: (userName: string, loginTime: string) => 
    `Bonjour ${userName} ! Votre connexion à RentiTool a été effectuée avec succès le ${loginTime}. Si vous n'êtes pas à l'origine de cette connexion, veuillez nous contacter immédiatement.`,
  
  bookingConfirmation: (toolName: string, date: string) => 
    `Votre réservation de l'outil "${toolName}" pour le ${date} a été confirmée.`,
  
  bookingReminder: (toolName: string, date: string) => 
    `Rappel: Vous avez réservé l'outil "${toolName}" pour demain ${date}.`,
};