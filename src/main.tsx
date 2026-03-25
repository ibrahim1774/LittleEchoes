import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './index.css';
import App from './App';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // Service worker registration failed silently
      });
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// StrictMode intentionally double-mounts components in development, which breaks
// MediaRecorder and getUserMedia — browser audio APIs are inherently side-effectful.
// Production builds never use StrictMode, so behavior is identical there.
createRoot(root).render(<App />);
