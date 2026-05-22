import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium transition hover:text-blue-200 ${isActive ? 'text-white underline underline-offset-4' : 'text-blue-100'}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuAbierto(false);
  };

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
          <span className="text-blue-300 text-sm">
            {user?.username} ({user?.rol})
          </span>
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
          <NavLink
            to="/lista"
            end
            className={linkClass}
            onClick={() => setMenuAbierto(false)}
          >
            Participantes
          </NavLink>
          {user?.rol === 'ADMIN' && (
            <NavLink
              to="/nuevo"
              className={linkClass}
              onClick={() => setMenuAbierto(false)}
            >
              Nuevo participante
            </NavLink>
          )}
          <span className="text-blue-300 text-sm">{user?.username} ({user?.rol})</span>
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
