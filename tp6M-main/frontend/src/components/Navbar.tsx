import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium transition hover:text-blue-200 ${isActive ? 'text-white underline underline-offset-4' : 'text-blue-100'}`;

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-blue-200 transition">
          Registro de Eventos
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/" end className={linkClass}>
            Inicio
          </NavLink>
          <NavLink to="/nuevo" className={linkClass}>
            Nuevo participante
          </NavLink>
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
            to="/"
            end
            className={linkClass}
            onClick={() => setMenuAbierto(false)}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/nuevo"
            className={linkClass}
            onClick={() => setMenuAbierto(false)}
          >
            Nuevo participante
          </NavLink>
        </div>
      )}
    </nav>
  );
}
