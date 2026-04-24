import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { Participante, type ParticipanteData } from '../models/Participante';
import { participantesReducer } from '../reducers/participantesReducer';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface ContextType {
  participantes: Participante[];
  participanteEnEdicion: Participante | null;
  agregar: (p: Omit<ParticipanteData, 'id'>) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
  editar: (p: Participante) => Promise<void>;
  seleccionarEdicion: (p: Participante | null) => void;
  resetear: () => Promise<void>;
}

const ParticipantesContext = createContext<ContextType | null>(null);

export function ParticipantesProvider({ children }: { children: ReactNode }) {
  const [participantes, dispatch] = useReducer(participantesReducer, []);
  const [participanteEnEdicion, setParticipanteEnEdicion] = useState<Participante | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/participantes`)
      .then((res) => res.json())
      .then((data: ParticipanteData[]) =>
        dispatch({ type: 'GET_PARTICIPANTES', payload: data.map(Participante.fromJSON) }),
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
    dispatch({ type: 'AGREGAR', payload: Participante.fromJSON(nuevo) });
  };

  const eliminar = async (id: number) => {
    await fetch(`${API_URL}/participantes/${id}`, { method: 'DELETE' });
    dispatch({ type: 'ELIMINAR', payload: id });
  };

  const editar = async (participante: Participante) => {
    const res = await fetch(`${API_URL}/participantes/${participante.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(participante),
    });
    const actualizado: ParticipanteData = await res.json();
    dispatch({ type: 'EDITAR', payload: Participante.fromJSON(actualizado) });
    setParticipanteEnEdicion(null);
  };

  const seleccionarEdicion = (p: Participante | null) => {
    setParticipanteEnEdicion(p);
  };

  const resetear = async () => {
    await fetch(`${API_URL}/participantes`, { method: 'DELETE' });
    dispatch({ type: 'RESET', payload: [] });
  };

  return (
    <ParticipantesContext.Provider
      value={{ participantes, participanteEnEdicion, agregar, eliminar, editar, seleccionarEdicion, resetear }}
    >
      {children}
    </ParticipantesContext.Provider>
  );
}

export function useParticipantes() {
  const ctx = useContext(ParticipantesContext);
  if (!ctx) throw new Error('useParticipantes debe usarse dentro de ParticipantesProvider');
  return ctx;
}
