/**
 * Utilitaire pour générer des messages personnalisés pour les réservations
 * Utilise l'API Gemini AI pour créer des messages contextuels
 */

export interface GenerateMessageParams {
  rentalId: number;
  messageType: 'confirmation' | 'reminder' | 'acceptance' | 'rejection' | 'completion' | 'cancellation';
  language?: 'fr' | 'en' | 'ar';
  recipient?: 'renter' | 'owner';
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Génère un message personnalisé pour une réservation
 * @param params - Paramètres de génération du message
 * @returns Le message généré ou null en cas d'erreur
 */
export async function generateRentalMessage(
  params: GenerateMessageParams
): Promise<MessageResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/ai/generate-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rentalId: params.rentalId,
        messageType: params.messageType,
        language: params.language || 'fr',
        recipient: params.recipient || 'renter',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message,
    };
  } catch (error: any) {
    console.error('Error generating rental message:', error);
    return {
      success: false,
      error: error?.message || 'Failed to generate message',
    };
  }
}

/**
 * Génère et envoie un message automatiquement (pour usage côté serveur)
 * Cette fonction ne bloque pas l'exécution en cas d'erreur
 */
export async function generateAutoMessage(
  rentalId: number,
  messageType: GenerateMessageParams['messageType'],
  language: 'fr' | 'en' | 'ar' = 'fr'
): Promise<string | null> {
  try {
    const result = await generateRentalMessage({
      rentalId,
      messageType,
      language,
    });

    if (result.success && result.message) {
      console.log(`✅ Message ${messageType} généré pour la réservation #${rentalId}`);
      // Ici vous pouvez ajouter l'envoi par email, SMS, notification push, etc.
      return result.message;
    } else {
      console.warn(`⚠️ Impossible de générer le message pour la réservation #${rentalId}:`, result.error);
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la génération du message pour la réservation #${rentalId}:`, error);
    return null;
  }
}

