import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Compra {
  id: number;
  curso: string;
  precio: number;
  fecha: string;
}

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [historial, setHistorial] = useState<Compra[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const historialRef = useRef<HTMLDivElement>(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium transition hover:text-blue-200 ${isActive ? 'text-white underline underline-offset-4' : 'text-blue-100'}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuAbierto(false);
  };

  const toggleHistorial = async () => {
    if (historialAbierto) {
      setHistorialAbierto(false);
      return;
    }
    setHistorialAbierto(true);
    setCargandoHistorial(true);
    try {
      const res = await fetch(`${API_URL}/pagos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as Compra[];
      setHistorial(data);
    } catch {
      setHistorial([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (historialRef.current && !historialRef.current.contains(e.target as Node)) {
        setHistorialAbierto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/lista" className="text-xl font-bold tracking-tight hover:text-blue-200 transition">
          Registro de Eventos
        </NavLink>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/lista" end className={linkClass}>
            Participantes
          </NavLink>
          {user?.rol === 'ADMIN' && (
            <NavLink to="/nuevo" className={linkClass}>
              Nuevo participante
            </NavLink>
          )}
          <NavLink to="/cursos" className={linkClass}>
            Cursos
          </NavLink>

          {/* Usuario con historial */}
          <div className="relative" ref={historialRef}>
            <button
              onClick={toggleHistorial}
              className="text-blue-300 text-sm hover:text-white transition flex items-center gap-1"
              title="Ver historial de compras"
            >
              {user?.username} ({user?.rol}) <span className="text-xs">▾</span>
            </button>

            {historialAbierto && (
              <div className="absolute right-0 top-8 w-80 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700 text-sm">Mis compras</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {cargandoHistorial ? (
                    <p className="text-center text-slate-400 py-6 text-sm">Cargando...</p>
                  ) : historial.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-sm">No compraste ningún curso todavía.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {historial.map((c) => (
                        <li key={c.id} className="px-4 py-3 text-sm">
                          <p className="font-medium text-slate-800">{c.curso}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            ${c.precio.toLocaleString('es-AR')} ARS ·{' '}
                            {new Date(c.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg transition font-medium text-sm"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Burger button (mobile) */}
        <button
          className="md:hidden p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
        >
          <span className="text-2xl leading-none">{menuAbierto ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuAbierto && (
        <div className="md:hidden bg-blue-800 px-4 pb-4 flex flex-col gap-3">
          <NavLink to="/lista" end className={linkClass} onClick={() => setMenuAbierto(false)}>
            Participantes
          </NavLink>
          {user?.rol === 'ADMIN' && (
            <NavLink to="/nuevo" className={linkClass} onClick={() => setMenuAbierto(false)}>
              Nuevo participante
            </NavLink>
          )}
          <NavLink to="/cursos" className={linkClass} onClick={() => setMenuAbierto(false)}>
            Cursos
          </NavLink>
          <button
            onClick={() => { setMenuAbierto(false); void toggleHistorial(); }}
            className="text-blue-300 text-sm text-left hover:text-white transition"
          >
            {user?.username} ({user?.rol}) · Ver mis compras
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-medium text-sm text-left"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}
