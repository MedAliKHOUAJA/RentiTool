// src/app/api/ai/suggest-tags/route.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const cardData = await req.json();

    console.log('Received tag request for:', cardData);

    // ✅ Parse SpecialtiesAndExpertise if it's a string
    let specialties: string[] = [];
    if (cardData.SpecialtiesAndExpertise) {
      if (typeof cardData.SpecialtiesAndExpertise === 'string') {
        try {
          specialties = JSON.parse(cardData.SpecialtiesAndExpertise);
        } catch (e) {
          console.warn('Failed to parse SpecialtiesAndExpertise:', e);
          specialties = [];
        }
      } else if (Array.isArray(cardData.SpecialtiesAndExpertise)) {
        specialties = cardData.SpecialtiesAndExpertise;
      }
    }

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      maxOutputTokens: 2000,
      temperature: 0.7,
      prompt: `Suggest 4-6 organizational tags for this business card.

Profile:
- Name: ${cardData.FirstName || ''} ${cardData.LastName || ''}
- Job Title: ${cardData.JobTitle || 'Not specified'}
- Company: ${cardData.CompanyName || 'Not specified'}
- Specialties: ${specialties.join(', ') || 'None'}
- Notes: ${cardData.Description || 'None'}

Consider: Industry, Role, Service Type, Network Category, Location, etc.

Respond with ONLY this JSON format (no markdown):
{"tags":["Industry","Role","Service","Category","Type"]}`,
    });

    const text = result.text?.trim() || '';

    if (!text) {
      console.warn('Empty tag response, using fallback');
      return NextResponse.json({ tags: [] });
    }

    // Clean markdown
    let cleanText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('Cleaned tag response:', cleanText);

    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Tag JSON parse failed:', cleanText);
      return NextResponse.json({ tags: [] });
    }

    return NextResponse.json({
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });

  } catch (error: any) {
    console.error('Tags error:', error.message);
    return NextResponse.json(
      { error: 'Failed to suggest tags', details: error.message },
      { status: 500 }
    );
  }
}