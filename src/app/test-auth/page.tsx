'use client';

import { useAuth } from '@/hooks/useAuth';

export default function TestAuthPage() {
  const { user, loading } = useAuth();

  console.log('🧪 [TestAuth] Render:', { user, loading });

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Test Auth</h1>
      <div className="space-y-2">
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'null'}</p>
      </div>
    </div>
  );
}