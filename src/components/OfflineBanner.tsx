'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-700 text-white text-center p-2 z-50 text-sm">
      <p>Vous êtes hors ligne. Le contenu affiché peut ne pas être à jour.</p>
    </div>
  );
}
