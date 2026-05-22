import { Link } from 'react-router-dom';

export default function PublicaPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 gap-6">
      <h1 className="text-3xl font-bold text-slate-800 text-center">
        Página Pública
      </h1>
      <p className="text-slate-600 text-center max-w-md">
        Esta página es accesible para cualquier visitante, sin necesidad de iniciar sesión.
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
