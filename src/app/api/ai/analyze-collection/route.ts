
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { cards } = await req.json();

    const cardSummaries = cards
      .map((c: any) => `${c.jobTitle} at ${c.companyName} - ${c.specialties?.join(', ') || 'no specialties'}`)
      .join('\n');

    const { text } = await generateText({
     model: google('gemini-2.5-flash'), // ✅ Updated model name
      maxOutputTokens: 2000,
      prompt: `Analyze this professional network collection and provide insights:

${cardSummaries}

Return ONLY a JSON object, no markdown:
{
  "topSpecialties": [{"specialty": "string", "count": number}],
  "networkGaps": ["area1", "area2"],
  "insights": ["insight1", "insight2"]
}`,
    });

    const parsed = JSON.parse(text.trim());
    return NextResponse.json({
      topSpecialties: parsed.topSpecialties || [],
      networkGaps: parsed.networkGaps || [],
      insights: parsed.insights || [],
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze collection' },
      { status: 500 }
    );
  }
}