'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[MGC] Service worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[MGC] Service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
