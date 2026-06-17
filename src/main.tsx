import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Novus Analytics
declare const pendo: any;
(function initNovus() {
  if (typeof pendo === 'undefined') return;
  // Generate a stable anonymous visitor ID persisted in localStorage
  let visitorId = localStorage.getItem('novus_visitor_id');
  if (!visitorId) {
    visitorId = 'anon-' + Math.random().toString(36).slice(2);
    localStorage.setItem('novus_visitor_id', visitorId);
  }
  pendo.initialize({
    visitor: {
      id: visitorId,
    },
    account: {
      id: 'trial-guard',
    },
  });
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
