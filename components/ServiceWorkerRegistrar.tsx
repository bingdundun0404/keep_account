"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    if ('serviceWorker' in navigator && (isHttps || isLocalhost)) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW register failed:', err);
      });
    }
  }, []);
  return null;
}