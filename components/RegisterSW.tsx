'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado com sucesso:', registration.scope);
          },
          (err) => {
            console.log('Falha ao registrar SW:', err);
          }
        );
      });
    } else if ('serviceWorker' in navigator) {
      // Registrar também em desenvolvimento para facilitar testes de PWA
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Falha ao registrar SW em dev:', err);
      });
    }
  }, []);

  return null;
}
