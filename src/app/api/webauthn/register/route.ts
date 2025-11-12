import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { addCredential, getChallenge, clearChallenge, getEnv } from '@/lib/webauthnStore';

export async function POST(req: Request) {
  try {
    const { email, attestation } = await req.json();
    if (!email || !attestation) {
      return NextResponse.json({ error: 'email and attestation are required' }, { status: 400 });
    }

    const expectedChallenge = getChallenge(email);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'no challenge found; start registration again' }, { status: 400 });
    }

    const { rpID, origin } = getEnv();

    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'registration verification failed' }, { status: 400 });
    }

    const { registrationInfo } = verification;
    const credID = registrationInfo.credentialID; // Uint8Array
    const credIDb64 = Buffer.from(credID).toString('base64url');

    addCredential(email, {
      id: credIDb64,
      publicKey: Buffer.from(registrationInfo.credentialPublicKey),
      counter: registrationInfo.counter,
      transports: (registrationInfo as any).transports || [],
    });

    clearChallenge(email); // pass email to clear the correct challenge

    const res = NextResponse.json({ success: true });
    res.cookies.set('passkey_session', email, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 });
  }
}