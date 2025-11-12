import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getCredentials, getChallenge, clearChallenge, updateCounter, getEnv } from '@/lib/webauthnStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, assertion } = body || {};
    if (!email || !assertion) {
      return NextResponse.json({ error: 'email and assertion are required' }, { status: 400 });
    }
    const expectedChallenge = getChallenge(email);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'no challenge found; start login again' }, { status: 400 });
    }
    const { rpID, origin } = getEnv();
    const authenticatorIDb64 = assertion.id;
    const creds = getCredentials(email);
    const authenticator = creds.find(c => c.id === authenticatorIDb64);
    if (!authenticator) {
      return NextResponse.json({ error: 'credential not found for user' }, { status: 404 });
    }
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: authenticator.id,
        credentialPublicKey: new Uint8Array(authenticator.publicKey),
        counter: authenticator.counter,
        transports: authenticator.transports,
      },
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: 'authentication verification failed' }, { status: 400 });
    }
    const { newCounter, credentialID } = verification.authenticationInfo;
    updateCounter(email, Buffer.from(credentialID).toString('base64url'), newCounter);
    clearChallenge(email);
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