import { useRef, useEffect, useId } from 'react';
import { useFormulario } from '../hooks/useFormulario';

function Formulario({ onSuccess }: { onSuccess?: () => void }) {
  const { formData, handleChange, handleSubmit, handleCancelar, modoEdicion } =
    useFormulario(onSuccess);

  // useRef — PARTE 1: foco automático al entrar al formulario
  const nombreRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  // useId — PARTE 2: IDs accesibles únicos por instancia
  const nombreId = useId();
  const emailId = useId();
  const edadId = useId();
  const paisId = useId();
  const modalidadId = useId();
  const tecnologiasId = useId();
  const nivelId = useId();
  const terminosId = useId();

  return (
    <section className="bg-white shadow rounded-xl p-5 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">
        {modoEdicion ? 'Editar participante' : 'Registro de Participantes'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor={nombreId} className="text-sm text-slate-600 mb-1">
            Nombre
          </label>
          <input
            ref={nombreRef}
            id={nombreId}
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="border border-slate-300 p-2 rounded-lg"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor={emailId} className="text-sm text-slate-600 mb-1">
            Email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-slate-300 p-2 rounded-lg"
            placeholder="Ej: juan@mail.com"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor={edadId} className="text-sm text-slate-600 mb-1">
            Edad
          </label>
          <input
            id={edadId}
            type="number"
            name="edad"
            value={formData.edad}
            onChange={handleChange}
            required
            min="1"
            className="border border-slate-300 p-2 rounded-lg"
            placeholder="Ej: 25"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor={paisId} className="text-sm text-slate-600 mb-1">
            País
          </label>
          <select
            id={paisId}
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            required
            className="border border-slate-300 p-2 rounded-lg bg-white"
          >
            <option value="">Seleccione un país...</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Uruguay">Uruguay</option>
            <option value="México">México</option>
            <option value="España">España</option>
            <option value="Brasil">Brasil</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <p id={modalidadId} className="text-sm text-slate-600 mb-2">
            Modalidad
          </p>
          <div role="radiogroup" aria-labelledby={modalidadId} className="flex flex-wrap gap-4">
            {['Presencial', 'Virtual', 'Hibrido'].map((modalidad) => {
              const radioId = `${modalidadId}-${modalidad}`;
              return (
                <div key={modalidad} className="flex items-center gap-2">
                  <input
                    id={radioId}
                    type="radio"
                    name="modalidad"
                    value={modalidad}
                    checked={formData.modalidad === modalidad}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor={radioId}>
                    {modalidad === 'Hibrido' ? 'Híbrido' : modalidad}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2">
          <p id={tecnologiasId} className="text-sm text-slate-600 mb-2">
            Tecnologías
          </p>
          <div
            role="group"
            aria-labelledby={tecnologiasId}
            className="grid grid-cols-2 md:grid-cols-3 gap-2"
          >
            {['React', 'Angular', 'Vue', 'Node', 'Python', 'Java'].map((tech) => {
              const checkId = `${tecnologiasId}-${tech}`;
              return (
                <div key={tech} className="flex items-center gap-2">
                  <input
                    id={checkId}
                    type="checkbox"
                    name="tecnologias"
                    value={tech}
                    checked={formData.tecnologias.includes(tech)}
                    onChange={handleChange}
                  />
                  <label htmlFor={checkId}>{tech}</label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col">
          <label htmlFor={nivelId} className="text-sm text-slate-600 mb-1">
            Nivel
          </label>
          <select
            id={nivelId}
            name="nivel"
            value={formData.nivel}
            onChange={handleChange}
            required
            className="border border-slate-300 p-2 rounded-lg bg-white"
          >
            <option value="">Seleccione nivel...</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-2 mt-1">
          <input
            id={terminosId}
            type="checkbox"
            name="aceptaTerminos"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
          />
          <label htmlFor={terminosId} className="text-sm text-slate-700">
            Acepto los términos y condiciones del evento
          </label>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {modoEdicion ? 'Actualizar' : 'Agregar participante'}
          </button>

          {modoEdicion && (
            <button
              type="button"
              onClick={handleCancelar}
              className="bg-slate-400 text-white px-4 py-2 rounded-lg hover:bg-slate-500 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default Formulario;
