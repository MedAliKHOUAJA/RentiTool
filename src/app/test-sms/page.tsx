// src/app/test-sms/page.tsx
"use client";

import { useState } from "react";

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const testSMS = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Succès: ${data.message} ${data.debugCode ? `(Code: ${data.debugCode})` : ''}`);
      } else {
        setResult(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      setResult(`💥 Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Test SMS Twilio</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33612345678"
              className="w-full p-3 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: +33612345678 (international)
            </p>
          </div>

          <button
            onClick={testSMS}
            disabled={loading || !phoneNumber}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Envoi en cours...' : 'Tester SMS'}
          </button>

          {result && (
            <div className={`p-4 rounded-lg ${
              result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result}
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <strong>Note:</strong> Assurez-vous que le numéro est vérifié dans votre compte Twilio (mode test) ou que vous avez des crédits (mode production).
          </div>
        </div>
      </div>
    </div>
  );
}