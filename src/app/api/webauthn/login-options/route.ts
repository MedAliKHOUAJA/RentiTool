// src/app/api/webauthn/login-options/route.ts
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getCredentials, setChallenge, getEnv } from '@/lib/webauthnStore';

// This must be a POST route in Next.js (app/api/webauthn/login-options/route.ts)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { rpID } = getEnv();

    // Retrieve stored credentials for this user
    const creds = getCredentials(email);
    if (!creds || creds.length === 0) {
      return NextResponse.json({ error: 'No credentials found for this user' }, { status: 404 });
    }

    // Convert stored credential IDs from base64url to Uint8Array
    const allowCredentials = creds.map(c => ({
      id: c.id,
      type: 'public-key' as const,
      transports: c.transports ?? ['internal'],
    }));

    // Generate WebAuthn login (authentication) options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Save challenge to your store (for later verification)
    setChallenge(email, options.challenge);

    return NextResponse.json(options);
  } catch (err: unknown) {
    console.error('❌ WebAuthn login-options error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}