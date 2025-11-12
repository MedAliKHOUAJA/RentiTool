// src/features/Cards/services/aiService.ts
export interface CardData {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  companyName?: string;
  description?: string;
  specialties?: string[];
}

// ────────────────────────────────────────────────────────────────
// 1. Enrich card (job title + specialties)
// ────────────────────────────────────────────────────────────────
export async function enrichCardData(
  cardData: CardData
): Promise<{
  suggestedSpecialties: string[];
  enrichedJobTitle?: string;
}> {
  try {
    const response = await fetch('/api/ai/enrich-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ✅ Convert camelCase to PascalCase for the API
      body: JSON.stringify({
        FirstName: cardData.firstName,
        LastName: cardData.lastName,
        JobTitle: cardData.jobTitle,
        CompanyName: cardData.companyName,
        SpecialtiesAndExpertise: cardData.specialties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      suggestedSpecialties: data.suggestedSpecialties || [],
      enrichedJobTitle: data.enrichedJobTitle || cardData.jobTitle,
    };
  } catch (error) {
    console.error('Error enriching card data:', error);
    return {
      suggestedSpecialties: [],
      enrichedJobTitle: cardData.jobTitle,
    };
  }
}

// ────────────────────────────────────────────────────────────────
// 2. Suggest tags for a single card
// ────────────────────────────────────────────────────────────────
export async function suggestCardTags(cardData: CardData): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ✅ Convert camelCase to PascalCase for the API
      body: JSON.stringify({
        FirstName: cardData.firstName,
        LastName: cardData.lastName,
        JobTitle: cardData.jobTitle,
        CompanyName: cardData.companyName,
        Description: cardData.description,
        SpecialtiesAndExpertise: cardData.specialties,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data.tags) ? data.tags : [];
  } catch (error) {
    console.error('Error suggesting tags:', error);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────
// 3. Analyze entire collection
// ────────────────────────────────────────────────────────────────
export async function analyzeCardCollection(
  cards: CardData[]
): Promise<{
  topSpecialties: { specialty: string; count: number }[];
  networkGaps: string[];
  insights: string[];
}> {
  try {
    const response = await fetch('/api/ai/analyze-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ✅ Convert each card's fields to PascalCase
      body: JSON.stringify({
        cards: cards.map(card => ({
          FirstName: card.firstName,
          LastName: card.lastName,
          JobTitle: card.jobTitle,
          CompanyName: card.companyName,
          Description: card.description,
          SpecialtiesAndExpertise: card.specialties,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      topSpecialties: data.topSpecialties || [],
      networkGaps: data.networkGaps || [],
      insights: data.insights || [],
    };
  } catch (error) {
    console.error('Error analyzing collection:', error);
    return {
      topSpecialties: [],
      networkGaps: [],
      insights: [],
    };
  }
}