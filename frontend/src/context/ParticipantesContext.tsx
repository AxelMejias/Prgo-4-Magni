import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Participante, type ParticipanteData } from '../models/Participante';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface ContextType {
  participantes: Participante[];
  agregar: (p: Omit<ParticipanteData, 'id'>) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
  resetear: () => Promise<void>;
}

const ParticipantesContext = createContext<ContextType | null>(null);

export function ParticipantesProvider({ children }: { children: ReactNode }) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  // Carga inicial desde la API
  useEffect(() => {
    fetch(`${API_URL}/participantes`)
      .then((res) => res.json())
      .then((data: ParticipanteData[]) =>
        setParticipantes(data.map((p) => Participante.fromJSON(p))),
      )
      .catch(console.error);
  }, []);

  const agregar = async (data: Omit<ParticipanteData, 'id'>) => {
    const res = await fetch(`${API_URL}/participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const nuevo: ParticipanteData = await res.json();
    setParticipantes((prev) => [...prev, Participante.fromJSON(nuevo)]);
  };

  const eliminar = async (id: number) => {
    await fetch(`${API_URL}/participantes/${id}`, { method: 'DELETE' });
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  };

  const resetear = async () => {
    await fetch(`${API_URL}/participantes`, { method: 'DELETE' });
    setParticipantes([]);
  };

  return (
    <ParticipantesContext.Provider value={{ participantes, agregar, eliminar, resetear }}>
      {children}
    </ParticipantesContext.Provider>
  );
}

export function useParticipantes() {
  const ctx = useContext(ParticipantesContext);
  if (!ctx) throw new Error('useParticipantes debe usarse dentro de ParticipantesProvider');
  return ctx;
}
