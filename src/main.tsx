// Defensive runtime fix for environments where window.fetch has only a getter
try {
  const nativeFetch = window.fetch;
  let currentFetch = typeof nativeFetch === 'function' ? nativeFetch.bind(window) : nativeFetch;

  if (typeof Window !== 'undefined' && Window.prototype) {
    try {
      const desc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
      if (desc && (!desc.writable || !desc.set)) {
        Object.defineProperty(Window.prototype, 'fetch', {
          get: () => currentFetch,
          set: (fn) => { currentFetch = fn; },
          configurable: true,
          enumerable: true
        });
      }
    } catch (_) {}
  }

  try {
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (fn) => { currentFetch = fn; },
      configurable: true,
      enumerable: true
    });
  } catch (_) {}
} catch (_) {}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
