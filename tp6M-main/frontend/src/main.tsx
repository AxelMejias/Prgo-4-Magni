import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ParticipantesProvider } from './context/ParticipantesContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ParticipantesProvider>
        <App />
      </ParticipantesProvider>
    </BrowserRouter>
  </StrictMode>,
);
