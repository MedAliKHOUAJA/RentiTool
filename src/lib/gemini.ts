import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialiser Gemini AI
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Types pour les messages de réservation
export interface RentalMessageContext {
  rentalId: number;
  toolId: number;
  toolName?: string;
  ownerId: number;
  ownerName?: string;
  renterId: number;
  renterName?: string;
  totalPrice: number;
  rentalDateStart: string;
  rentalDateEnd: string;
  statusId: number;
  statusText: string;
  messageType: 'confirmation' | 'reminder' | 'acceptance' | 'rejection' | 'completion' | 'cancellation';
  language?: 'fr' | 'en' | 'ar';
}

// Générer un message personnalisé avec Gemini
export async function generateRentalMessage(context: RentalMessageContext): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const language = context.language || 'fr';
    const languageName = language === 'fr' ? 'français' : language === 'en' ? 'anglais' : 'arabe';

    // Construire le prompt selon le type de message
    let prompt = '';
    
    switch (context.messageType) {
      case 'confirmation':
        prompt = `Génère un message de confirmation de réservation en ${languageName} pour une plateforme de location d'outils. 
Le message doit être professionnel, amical et informatif. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}
- Période: du ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} au ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}
- Prix total: ${context.totalPrice} TND
- Statut: En attente de confirmation du propriétaire

Le message doit être adressé au locataire et doit expliquer que sa demande de réservation a été reçue et est en attente de confirmation.`;
        break;

      case 'acceptance':
        prompt = `Génère un message d'acceptation de réservation en ${languageName} pour une plateforme de location d'outils.
Le message doit être professionnel, positif et informatif. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}
- Période: du ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} au ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}
- Prix total: ${context.totalPrice} TND

Le message doit être adressé au locataire et doit confirmer que sa réservation a été acceptée par le propriétaire.`;
        break;

      case 'rejection':
        prompt = `Génère un message de refus de réservation en ${languageName} pour une plateforme de location d'outils.
Le message doit être professionnel, respectueux et empathique. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}
- Période demandée: du ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} au ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}

Le message doit être adressé au locataire et doit expliquer poliment que sa demande de réservation n'a pas pu être acceptée.`;
        break;

      case 'reminder':
        prompt = `Génère un message de rappel en ${languageName} pour une réservation qui approche.
Le message doit être amical et informatif. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}
- Date de début: ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')}
- Date de fin: ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}

Le message doit rappeler au locataire que sa réservation commence bientôt.`;
        break;

      case 'completion':
        prompt = `Génère un message de fin de réservation en ${languageName} pour une plateforme de location d'outils.
Le message doit être professionnel et remercier le client. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}
- Période: du ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} au ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}

Le message doit être adressé au locataire et doit remercier pour l'utilisation de la plateforme.`;
        break;

      case 'cancellation':
        prompt = `Génère un message d'annulation de réservation en ${languageName} pour une plateforme de location d'outils.
Le message doit être professionnel et informatif. Inclus les détails suivants:
- ID de réservation: ${context.rentalId}
- Outil: ${context.toolName || `Outil #${context.toolId}`}

Le message doit informer le locataire que sa réservation a été annulée.`;
        break;

      default:
        prompt = `Génère un message professionnel en ${languageName} concernant une réservation.`;
    }

    // Ajouter des instructions générales
    prompt += `\n\nInstructions:
- Le message doit être concis (maximum 150 mots)
- Utilise un ton professionnel mais amical
- Inclus tous les détails importants
- Termine par une invitation à contacter le support si nécessaire
- Réponds UNIQUEMENT avec le message, sans préfixe ni suffixe`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error: any) {
    console.error('Error generating message with Gemini:', error);
    
    // Message de fallback si Gemini échoue
    return generateFallbackMessage(context);
  }
}

// Message de fallback si Gemini n'est pas disponible
function generateFallbackMessage(context: RentalMessageContext): string {
  const language = context.language || 'fr';
  
  const messages: Record<string, Record<string, string>> = {
    fr: {
      confirmation: `Bonjour,\n\nVotre demande de réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" a été reçue avec succès.\n\nPériode: ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} - ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}\nPrix total: ${context.totalPrice} TND\n\nVotre demande est en attente de confirmation par le propriétaire. Vous recevrez une notification dès qu'une décision sera prise.\n\nMerci pour votre confiance !`,
      acceptance: `Bonjour,\n\nExcellente nouvelle ! Votre réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" a été acceptée.\n\nPériode: ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')} - ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}\nPrix total: ${context.totalPrice} TND\n\nVous pouvez maintenant procéder au paiement. Nous vous souhaitons une excellente expérience !`,
      rejection: `Bonjour,\n\nNous regrettons de vous informer que votre demande de réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" n'a pas pu être acceptée.\n\nLe propriétaire a dû refuser cette demande. Nous vous encourageons à explorer d'autres options disponibles sur notre plateforme.\n\nMerci de votre compréhension.`,
      reminder: `Bonjour,\n\nRappel : Votre réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" commence bientôt.\n\nDate de début: ${new Date(context.rentalDateStart).toLocaleDateString('fr-FR')}\nDate de fin: ${new Date(context.rentalDateEnd).toLocaleDateString('fr-FR')}\n\nAssurez-vous d'être prêt pour la récupération de l'outil.`,
      completion: `Bonjour,\n\nVotre réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" est maintenant terminée.\n\nNous espérons que vous avez été satisfait de votre expérience. N'hésitez pas à laisser un avis sur notre plateforme.\n\nMerci d'avoir utilisé nos services !`,
      cancellation: `Bonjour,\n\nVotre réservation #${context.rentalId} pour "${context.toolName || `Outil #${context.toolId}`}" a été annulée.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nMerci.`
    },
    en: {
      confirmation: `Hello,\n\nYour rental request #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" has been received successfully.\n\nPeriod: ${new Date(context.rentalDateStart).toLocaleDateString('en-US')} - ${new Date(context.rentalDateEnd).toLocaleDateString('en-US')}\nTotal price: ${context.totalPrice} TND\n\nYour request is pending confirmation from the owner. You will receive a notification once a decision is made.\n\nThank you for your trust!`,
      acceptance: `Hello,\n\nGreat news! Your reservation #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" has been accepted.\n\nPeriod: ${new Date(context.rentalDateStart).toLocaleDateString('en-US')} - ${new Date(context.rentalDateEnd).toLocaleDateString('en-US')}\nTotal price: ${context.totalPrice} TND\n\nYou can now proceed with payment. We wish you an excellent experience!`,
      rejection: `Hello,\n\nWe regret to inform you that your rental request #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" could not be accepted.\n\nThe owner had to decline this request. We encourage you to explore other options available on our platform.\n\nThank you for your understanding.`,
      reminder: `Hello,\n\nReminder: Your reservation #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" is starting soon.\n\nStart date: ${new Date(context.rentalDateStart).toLocaleDateString('en-US')}\nEnd date: ${new Date(context.rentalDateEnd).toLocaleDateString('en-US')}\n\nMake sure you're ready for tool pickup.`,
      completion: `Hello,\n\nYour reservation #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" is now completed.\n\nWe hope you were satisfied with your experience. Feel free to leave a review on our platform.\n\nThank you for using our services!`,
      cancellation: `Hello,\n\nYour reservation #${context.rentalId} for "${context.toolName || `Tool #${context.toolId}`}" has been cancelled.\n\nIf you have any questions, please don't hesitate to contact us.\n\nThank you.`
    }
  };

  return messages[language]?.[context.messageType] || messages.fr[context.messageType] || 'Message non disponible';
}

