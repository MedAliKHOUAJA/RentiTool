// src/app/api/webauthn/register-options/route.ts
import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { ensureUser, getCredentials, setChallenge, getEnv } from '@/lib/webauthnStore';

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const user = ensureUser(email, username);
    const { rpID, rpName } = getEnv();

    const excludeCredentials = getCredentials(email).map(c => ({
      id: c.id,
      type: 'public-key' as const,
      transports: c.transports,
    }));

    const options = await generateRegistrationOptions({
      rpID,
      rpName,
      userID: new TextEncoder().encode(user.email),
      userName: user.username || user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      excludeCredentials,
    });

    setChallenge(email, options.challenge);
    return NextResponse.json(options);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}