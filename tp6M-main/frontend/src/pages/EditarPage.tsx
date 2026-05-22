import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useParticipantes } from '../context/ParticipantesContext';
import Formulario from '../components/Formulario';

export default function EditarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { participantes, seleccionar } = useParticipantes();

  useEffect(() => {
    const participante = participantes.find((p) => p.id === Number(id));
    if (participante) {
      seleccionar(participante);
    }
  }, [id, participantes, seleccionar]);

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
