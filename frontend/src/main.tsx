import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Home from './Home';
import { ParticipantesProvider } from './context/ParticipantesContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParticipantesProvider>
      <Home />
    </ParticipantesProvider>
  </StrictMode>,
);
