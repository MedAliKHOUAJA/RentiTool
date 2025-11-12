// src/app/api/test-gemini/route.ts
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function GET() {
  try {
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Say "Hello, API is working!"',
    });

    return NextResponse.json({
      success: true,
      response: result.text,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}