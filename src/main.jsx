import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n'
import { initializeDatabase } from './db/seed'
import App from './App.jsx'

// SPA redirect desde 404.html
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('p');
if (redirectPath) {
  const cleaned = redirectPath.replace('/gymRatNotes', '') || '/';
  window.history.replaceState(null, '', '/gymRatNotes' + cleaned);
}

initializeDatabase().catch(() => {}).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
  });
}

// Capture PWA install prompt for manual trigger
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  window.dispatchEvent(new Event('pwainstallready'));
});
