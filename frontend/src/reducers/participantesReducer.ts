import type { Participante } from '../models/Participante';

export type Action =
  | { type: 'GET_PARTICIPANTES'; payload: Participante[] }
  | { type: 'SET'; payload: Participante[] }
  | { type: 'AGREGAR'; payload: Participante }
  | { type: 'ELIMINAR'; payload: number }
  | { type: 'DAR_BAJA'; payload: number }
  | { type: 'REACTIVAR'; payload: number }
  | { type: 'RESET'; payload: Participante[] }
  | { type: 'EDITAR'; payload: Participante };

export function participantesReducer(state: Participante[], action: Action): Participante[] {
  switch (action.type) {
    case 'GET_PARTICIPANTES':
    case 'SET':
      return action.payload;
    case 'AGREGAR':
      return [...state, action.payload];
    case 'ELIMINAR':
      return state.filter((p) => p.id !== action.payload);
    case 'DAR_BAJA':
      return state.map((p) => (p.id === action.payload ? { ...p, activo: false } : p));
    case 'REACTIVAR':
      return state.map((p) => (p.id === action.payload ? { ...p, activo: true } : p));
    case 'RESET':
      return action.payload;
    case 'EDITAR':
      return state.map((p) => (p.id === action.payload.id ? action.payload : p));
  }
}
