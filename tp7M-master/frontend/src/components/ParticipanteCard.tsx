import { useNavigate } from 'react-router-dom';
import { Participante } from '../models/Participante';
import { useParticipantes } from '../context/ParticipantesContext';
import { useAuth } from '../context/AuthContext';

interface ParticipanteCardProps {
  participante: Participante;
}

const colorPorNivel: Record<string, string> = {
  Principiante: 'bg-green-100 border-green-300',
  Intermedio: 'bg-yellow-100 border-yellow-300',
  Avanzado: 'bg-red-100 border-red-300',
};

function ParticipanteCard({ participante }: ParticipanteCardProps) {
  const { darBaja, reactivar } = useParticipantes();
  const { user } = useAuth();
  const navigate = useNavigate();

  const esAdmin = user?.rol === 'ADMIN';
  const inactivo = !participante.activo;

  const claseColor = inactivo
    ? 'bg-slate-100 border-slate-300 opacity-60'
    : (colorPorNivel[participante.nivel] ?? 'bg-white border-slate-200');

  const handleDarBaja = async () => {
    const ok = window.confirm(`¿Dar de baja a ${participante.nombre}? El registro se conserva en la base de datos.`);
    if (ok) await darBaja(participante.id);
  };

  const handleReactivar = async () => {
    await reactivar(participante.id);
  };

  return (
    <article
      className={`${claseColor} border shadow rounded-xl p-4 flex flex-col justify-between`}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-800">{participante.nombre}</h3>
          {inactivo && (
            <span className="text-xs bg-slate-400 text-white px-2 py-0.5 rounded-full font-medium">
              Baja
            </span>
          )}
        </div>
        <p className="text-sm text-slate-700">
          <strong>Email:</strong> {participante.email}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Edad:</strong> {participante.edad}
        </p>
        <p className="text-sm text-slate-700">
          <strong>País:</strong> {participante.pais}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Modalidad:</strong>{' '}
          {participante.modalidad === 'Hibrido' ? 'Híbrido' : participante.modalidad}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Nivel:</strong> {participante.nivel}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Tecnologías:</strong>{' '}
          {participante.tecnologias.length > 0
            ? participante.tecnologias.join(', ')
            : 'Sin tecnologías'}
        </p>
      </div>

      {esAdmin && (
        <div className="flex gap-2 mt-4">
          {inactivo ? (
            <button
              type="button"
              onClick={handleReactivar}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
            >
              Reactivar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate(`/editar/${participante.id}`)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={handleDarBaja}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Dar de baja
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default ParticipanteCard;
