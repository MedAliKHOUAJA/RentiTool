"use client";
import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChooseAuthMethodPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState<'register' | 'login' | null>(null);
  const router = useRouter();

  async function registerPasskey() {
    try {
      setLoading('register');
      const optionsRes = await fetch('/api/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: name }),
      });
      const options = await optionsRes.json();
      if (!options.challenge) throw new Error(options.error || 'Failed to get register options');

      const attestation = await startRegistration(options);
      const verifyRes = await fetch('/api/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, attestation }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson.error || 'Registration failed');
      router.push('/profile');
    } catch (err: any) {
      alert(err?.message || 'Registration error');
    } finally {
      setLoading(null);
    }
  }

  async function loginPasskey() {
    try {
      setLoading('login');
      const optionsRes = await fetch('/api/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const options = await optionsRes.json();
      if (!options.challenge) throw new Error(options.error || 'Failed to get login options');

      const assertion = await startAuthentication(options);
      const verifyRes = await fetch('/api/webauthn/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, assertion }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson.error || 'Login failed');
      router.push('/profile');
    } catch (err: any) {
      alert(err?.message || 'Login error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Choose Authentication Method</h1>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <div className="flex gap-3">
          <button
            onClick={registerPasskey}
            disabled={!email || loading !== null}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading === 'register' ? 'Registering…' : 'Register Face ID (Passkey)'}
          </button>
          <button
            onClick={loginPasskey}
            disabled={!email || loading !== null}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading === 'login' ? 'Logging in…' : 'Login with Face ID'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Prefer password or email? <Link href="/login" className="underline">Go to classic login</Link>
        </p>
      </div>
    </div>
  );
}