import { useState, useRef, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const QUICK_FILL = [
  { label: 'admin', username: 'admin', password: 'admin123' },
  { label: 'consulta', username: 'consulta', password: 'consulta123' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (user) return <Navigate to="/lista" />;

  const handleQuickFill = (entry: typeof QUICK_FILL[number]) => {
    setUsername(entry.username);
    setPassword(entry.password);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(username, password);
      navigate('/lista');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8 text-center">
        Iniciar Sesión — Registro de Participantes
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            autoFocus
          />
          {showSuggestions && (
            <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              {QUICK_FILL.map((entry) => (
                <li key={entry.username}>
                  <button
                    type="button"
                    onMouseDown={() => handleQuickFill(entry)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-700">{entry.label}</span>
                    <span className="text-slate-400 text-xs">autocompletar</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Login'}
        </button>


      </form>
    </div>
  );
}
