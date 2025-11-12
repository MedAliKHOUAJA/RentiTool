// src/app/api/ai/enrich-card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: NextRequest) {
  try {
    const cardData = await req.json();
    
    console.log('Received card data:', cardData);

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      maxOutputTokens: 2000, // ✅ Increased from 500 to 2000
      temperature: 0.7,
      prompt: `You are a career advisor. Suggest 3-5 specialties and an improved job title for this profile.

Profile:
- Name: ${cardData.FirstName || ''} ${cardData.LastName || ''}
- Job Title: ${cardData.JobTitle || 'Not specified'}
- Company: ${cardData.CompanyName || 'Not specified'}

Respond with ONLY this JSON format (no markdown, no explanation):
{"suggestedSpecialties":["Specialty1","Specialty2","Specialty3"],"enrichedJobTitle":"Better Title"}`,
    });

    console.log('Gemini response received');

    const text = result.text?.trim() || '';

    if (!text) {
      console.warn('Empty response from AI, using fallback');
      return NextResponse.json({
        suggestedSpecialties: [],
        enrichedJobTitle: cardData.JobTitle,
      });
    }

    // Clean markdown if present
    let cleanText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('Cleaned response:', cleanText);

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parse failed:', cleanText);
      return NextResponse.json({
        suggestedSpecialties: [],
        enrichedJobTitle: cardData.JobTitle,
      });
    }

    return NextResponse.json({
      suggestedSpecialties: Array.isArray(parsed.suggestedSpecialties) 
        ? parsed.suggestedSpecialties 
        : [],
      enrichedJobTitle: parsed.enrichedJobTitle || cardData.JobTitle,
    });

  } catch (error: any) {
    console.error('Enrichment error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to enrich card',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}