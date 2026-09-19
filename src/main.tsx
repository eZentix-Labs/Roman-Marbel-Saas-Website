import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { read, KEYS } from './lib/storage';

// Set the document language before first paint so screen readers announce
// Bengali content correctly from the start (PRD N-2.1).
document.documentElement.lang = read<string>(KEYS.lang, 'en');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
