import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Self-hosted fonts (no third-party font requests).
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';

// Order matters: tokens first, then base, then components and layout.
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/app.css';
import './components/calendar/calendar.css';
import './components/tasks/tasks.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
