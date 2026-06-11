import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MenuPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 gap-6">
      <h1 className="text-2xl font-bold text-slate-700 mb-2">Páginas / Menú</h1>
      <p className="text-slate-500 text-sm mb-4">
        Bienvenido, <strong>{user?.username}</strong> — Rol:{' '}
        <span className={user?.rol === 'ADMIN' ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
          {user?.rol}
        </span>
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to="/lista"
          className="bg-blue-600 text-white text-center py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow"
        >
          Lista de Participantes
        </Link>

        {user?.rol === 'ADMIN' && (
          <Link
            to="/nuevo"
            className="bg-blue-600 text-white text-center py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow"
          >
            Nuevo participante
          </Link>
        )}

        <Link
          to="/cursos"
          className="bg-blue-500 text-white text-center py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-600 transition shadow"
        >
          💳 Cursos disponibles
        </Link>

        <button
          onClick={logout}
          className="bg-red-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-red-600 transition shadow"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
