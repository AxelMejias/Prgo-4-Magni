import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

type Resultado = 'success' | 'failure' | 'pending';

const SEGUNDOS = 5;

const config: Record<Resultado, { icono: string; titulo: string; descripcion: string; color: string; btnColor: string }> = {
  success: {
    icono: '✅',
    titulo: '¡Pago exitoso!',
    descripcion: 'Tu pago fue procesado correctamente. Pronto recibirás la información del curso en tu email.',
    color: 'bg-green-50 border-green-200',
    btnColor: 'bg-green-600 hover:bg-green-700',
  },
  failure: {
    icono: '❌',
    titulo: 'El pago no se pudo procesar',
    descripcion: 'Hubo un problema con tu pago. Podés intentarlo nuevamente.',
    color: 'bg-red-50 border-red-200',
    btnColor: 'bg-red-600 hover:bg-red-700',
  },
  pending: {
    icono: '⏳',
    titulo: 'Pago pendiente',
    descripcion: 'Tu pago está siendo procesado. Te notificaremos cuando se acredite.',
    color: 'bg-yellow-50 border-yellow-200',
    btnColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
};

interface PagoResultadoPageProps {
  tipo: Resultado;
}

export default function PagoResultadoPage({ tipo }: PagoResultadoPageProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState(SEGUNDOS);
  const { icono, titulo, descripcion, color, btnColor } = config[tipo];

  const paymentId = params.get('payment_id');
  const status = params.get('status');
  const externalReference = params.get('external_reference');

  useEffect(() => {
    if (cuenta <= 0) {
      navigate('/cursos');
      return;
    }
    const timer = setTimeout(() => setCuenta((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cuenta, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className={`${color} border rounded-2xl shadow-md p-8 max-w-md w-full text-center`}>
        <div className="text-6xl mb-4">{icono}</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">{titulo}</h1>
        <p className="text-slate-600 mb-6">{descripcion}</p>

        {paymentId && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 text-left text-sm text-slate-600 space-y-1">
            {paymentId && <p><strong>ID de pago:</strong> {paymentId}</p>}
            {status && <p><strong>Estado:</strong> {status}</p>}
            {externalReference && <p><strong>Referencia:</strong> {externalReference}</p>}
          </div>
        )}

        <button
          onClick={() => navigate('/cursos')}
          className={`${btnColor} text-white font-bold py-3 px-6 rounded-xl transition w-full mb-3`}
        >
          Volver a los cursos
        </button>
        <p className="text-sm text-slate-400">
          Redirigiendo automáticamente en {cuenta}s...
        </p>
      </div>
    </main>
  );
}
