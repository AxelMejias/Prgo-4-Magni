import { createContext, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { Participante, type ParticipanteData } from '../models/Participante';
import { participantesReducer } from '../reducers/participantesReducer';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface ContextType {
  participantes: Participante[];
  participanteEnEdicion: Participante | null;
  agregar: (p: Omit<ParticipanteData, 'id' | 'activo'>) => Promise<void>;
  darBaja: (id: number) => Promise<void>;
  reactivar: (id: number) => Promise<void>;
  editar: (p: Omit<ParticipanteData, 'activo'>) => Promise<void>;
  seleccionar: (p: Participante | null) => void;
  resetear: () => Promise<void>;
}

const ParticipantesContext = createContext<ContextType | null>(null);

export function ParticipantesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [participantes, dispatch] = useReducer(participantesReducer, []);
  const [participanteEnEdicion, setParticipanteEnEdicion] = useState<Participante | null>(null);

  useEffect(() => {
    if (!token) {
      dispatch({ type: 'RESET', payload: [] });
      return;
    }
    fetch(`${API_URL}/participantes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: ParticipanteData[]) =>
        dispatch({ type: 'GET_PARTICIPANTES', payload: data.map(Participante.fromJSON) }),
      )
      .catch(console.error);
  }, [token]);

  const agregar = async (data: Omit<ParticipanteData, 'id' | 'activo'>) => {
    const res = await fetch(`${API_URL}/participantes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const nuevo: ParticipanteData = await res.json();
    dispatch({ type: 'AGREGAR', payload: Participante.fromJSON(nuevo) });
  };

  const darBaja = async (id: number) => {
    await fetch(`${API_URL}/participantes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    dispatch({ type: 'DAR_BAJA', payload: id });
  };

  const reactivar = async (id: number) => {
    const res = await fetch(`${API_URL}/participantes/${id}/reactivar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const actualizado: ParticipanteData = await res.json();
    dispatch({ type: 'REACTIVAR', payload: actualizado.id });
  };

  const editar = async (participante: Omit<ParticipanteData, 'activo'>) => {
    const res = await fetch(`${API_URL}/participantes/${participante.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(participante),
    });
    const actualizado: ParticipanteData = await res.json();
    dispatch({ type: 'EDITAR', payload: Participante.fromJSON(actualizado) });
    setParticipanteEnEdicion(null);
  };

  const seleccionar = useCallback((p: Participante | null) => {
    setParticipanteEnEdicion(p);
  }, []);

  const resetear = async () => {
    await fetch(`${API_URL}/participantes`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    dispatch({ type: 'RESET', payload: [] });
  };

  return (
    <ParticipantesContext.Provider
      value={{ participantes, participanteEnEdicion, agregar, darBaja, reactivar, editar, seleccionar, resetear }}
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
