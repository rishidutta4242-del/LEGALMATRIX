import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard against any stray browser notification popups in embedded or demo environments
if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    (window as any).Notification.requestPermission = () => Promise.resolve('default');
  } catch (e) {
    // Ignore read-only overrides
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

