import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  icono: string;
  color: string;
}

const cursos: Curso[] = [
  {
    id: 1,
    titulo: 'Curso React',
    descripcion: 'Dominá React con hooks, contexto, rutas y buenas prácticas modernas.',
    precio: 25000,
    icono: '⚛️',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: 2,
    titulo: 'Curso Node.js & Express',
    descripcion: 'Construí APIs REST robustas con Node.js, Express, JWT y PostgreSQL.',
    precio: 28000,
    icono: '🟢',
    color: 'bg-green-50 border-green-200',
  },
  {
    id: 3,
    titulo: 'Curso DBA',
    descripcion: 'Administración de bases de datos relacionales: modelado, optimización y seguridad.',
    precio: 40000,
    icono: '🗄️',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    id: 4,
    titulo: 'Curso TypeScript',
    descripcion: 'Tipado estático, genéricos, decoradores y configuración avanzada de TS.',
    precio: 22000,
    icono: '🔷',
    color: 'bg-indigo-50 border-indigo-200',
  },
  {
    id: 5,
    titulo: 'Curso DevOps & Docker',
    descripcion: 'Contenedores, CI/CD, Docker Compose y despliegue en producción.',
    precio: 35000,
    icono: '🐳',
    color: 'bg-cyan-50 border-cyan-200',
  },
  {
    id: 6,
    titulo: 'Curso Python & FastAPI',
    descripcion: 'Desarrollo backend con Python: FastAPI, async/await, pydantic y más.',
    precio: 30000,
    icono: '🐍',
    color: 'bg-yellow-50 border-yellow-200',
  },
];

export default function CursosPage() {
  const { token } = useAuth();
  const [cargando, setCargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComprar = async (curso: Curso) => {
    setCargando(curso.id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo: curso.titulo, precio: curso.precio }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Error al crear la preferencia de pago');
      }

      const data = await res.json() as { checkout_url: string };
      // Redirigir al checkout de Mercado Pago
      window.location.href = data.checkout_url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(null);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 mb-2">
            Trabajo Práctico N° 9
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Cursos Disponibles
          </h1>
          <p className="text-slate-500 mt-2">
            Seleccioná el curso que querés realizar y pagá con Mercado Pago
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <article
              key={curso.id}
              className={`${curso.color} border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition`}
            >
              <div>
                <div className="text-4xl mb-3">{curso.icono}</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{curso.titulo}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{curso.descripcion}</p>
              </div>

              <div className="mt-6">
                <p className="text-2xl font-bold text-slate-900 mb-4">
                  ${curso.precio.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-slate-500 ml-1">ARS</span>
                </p>
                <button
                  type="button"
                  onClick={() => handleComprar(curso)}
                  disabled={cargando === curso.id}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {cargando === curso.id ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      QUIERO ESTE CURSO
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
