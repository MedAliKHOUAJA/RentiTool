import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";

export interface AzureSentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  rating: number;
}

// Initialiser le client Azure
const endpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;
const apiKey = process.env.AZURE_TEXT_ANALYTICS_KEY;

if (!endpoint || !apiKey) {
  console.warn(
    '⚠️ Azure Text Analytics non configuré. Les variables AZURE_TEXT_ANALYTICS_ENDPOINT et AZURE_TEXT_ANALYTICS_KEY sont requises.'
  );
}

let client: TextAnalyticsClient | null = null;

if (endpoint && apiKey) {
  client = new TextAnalyticsClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );
}

/**
 * Analyse le sentiment d'un commentaire avec Azure Text Analytics
 */
export async function analyzeSentiment(
  comment: string
): Promise<AzureSentimentResult> {
  if (!client) {
    throw new Error('Azure Text Analytics client not initialized');
  }

  try {
    const [result] = await client.analyzeSentiment([comment], "fr");

    if (result.error) {
      throw new Error(result.error.message);
    }

    const { sentiment, confidenceScores } = result;

    // Calculer un rating basé sur les scores
    const rating = calculateRatingFromSentiment(sentiment, confidenceScores);

    return {
      sentiment,
      confidenceScores,
      rating,
    };
  } catch (error) {
    console.error("Erreur lors de l'analyse du sentiment:", error);
    throw error;
  }
}

/**
 * Calcule un rating de 1 à 5 basé sur le sentiment
 * Ce rating peut être utilisé pour suggérer une note à l'utilisateur
 */
function calculateRatingFromSentiment(
  sentiment: string,
  scores: {
    positive: number;
    neutral: number;
    negative: number;
  }
): number {
  let baseRating: number;

  switch (sentiment) {
    case 'positive':
      // 4 à 5 étoiles basé sur la confiance
      baseRating = 4 + scores.positive;
      break;
    case 'neutral':
      // Autour de 3 étoiles
      baseRating = 2.5 + scores.neutral * 0.5;
      break;
    case 'negative':
      // 1 à 2 étoiles basé sur la confiance
      baseRating = 2 - scores.negative;
      break;
    case 'mixed':
      // Calculer basé sur les scores
      baseRating = 1 + (scores.positive * 4) - (scores.negative * 2);
      break;
    default:
      baseRating = 3;
  }

  // S'assurer que le rating est entre 1 et 5
  return Math.max(1, Math.min(5, Math.round(baseRating * 2) / 2));
}

/**
 * Analyse plusieurs commentaires en batch
 */
export async function analyzeSentimentBatch(
  comments: string[]
): Promise<AzureSentimentResult[]> {
  if (!client) {
    throw new Error('Azure Text Analytics client not initialized');
  }

  try {
    const results = await client.analyzeSentiment(comments, "fr");

    return results.map((result, index) => {
      if (result.error) {
        throw new Error(result.error.message);
      }

      const { sentiment, confidenceScores } = result;
      const rating = calculateRatingFromSentiment(sentiment, confidenceScores);

      return {
        sentiment,
        confidenceScores,
        rating,
      };
    });
  } catch (error) {
    console.error("Erreur lors de l'analyse batch:", error);
    throw error;
  }
}