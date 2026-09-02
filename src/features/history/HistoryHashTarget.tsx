'use client';

import { useEffect } from 'react';

export function HistoryHashTarget() {
  useEffect(() => {
    if (window.location.hash === '#integrantes') {
      document.getElementById('integrantes')?.scrollIntoView();
    }
  }, []);

  return null;
}
