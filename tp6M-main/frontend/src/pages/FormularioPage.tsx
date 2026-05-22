import { useNavigate, Link } from 'react-router-dom';
import Formulario from '../components/Formulario';

export default function FormularioPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-700 transition text-sm font-medium">
            ← Volver al listado
          </Link>
        </div>
        <Formulario onSuccess={() => navigate('/')} />
      </div>
    </main>
  );
}
