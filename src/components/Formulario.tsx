import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { ParticipanteData } from '../models/Participante';

type FormularioData = Omit<ParticipanteData, 'id' | 'edad'> & {
  edad: string;
};

interface FormularioProps {
  onAgregar: (participante: Omit<ParticipanteData, 'id'>) => void;
}

const estadoInicial: FormularioData = {
  nombre: '',
  email: '',
  edad: '',
  pais: '',
  modalidad: '',
  tecnologias: [],
  nivel: '',
  aceptaTerminos: false,
};

function Formulario({ onAgregar }: FormularioProps) {
  const [formData, setFormData] = useState<FormularioData>(estadoInicial);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;

      if (name === 'aceptaTerminos') {
        setFormData((prev) => ({ ...prev, aceptaTerminos: target.checked }));
        return;
      }

      if (name === 'tecnologias') {
        setFormData((prev) => ({
          ...prev,
          tecnologias: target.checked
            ? [...prev.tecnologias, value]
            : prev.tecnologias.filter((tech) => tech !== value),
        }));
      }

      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.aceptaTerminos) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    onAgregar({
      nombre: formData.nombre,
      email: formData.email,
      edad: Number(formData.edad),
      pais: formData.pais,
      modalidad: formData.modalidad,
      tecnologias: formData.tecnologias,
      nivel: formData.nivel,
      aceptaTerminos: formData.aceptaTerminos,
    });

    setFormData(estadoInicial);
  };

  return (
    <section className="bg-white shadow rounded-xl p-5 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">Alta de participante</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-1">Nombre</label>
          <input
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
          <label className="text-sm text-slate-600 mb-1">Email</label>
          <input
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
          <label className="text-sm text-slate-600 mb-1">Edad</label>
          <input
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
          <label className="text-sm text-slate-600 mb-1">País</label>
          <select
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
          </select>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-slate-600 mb-2">Modalidad</p>
          <div className="flex flex-wrap gap-4">
            {['Presencial', 'Virtual', 'Hibrido'].map((modalidad) => (
              <label key={modalidad} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="modalidad"
                  value={modalidad}
                  checked={formData.modalidad === modalidad}
                  onChange={handleChange}
                  required
                />
                {modalidad === 'Hibrido' ? 'Híbrido' : modalidad}
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-slate-600 mb-2">Tecnologías</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['React', 'Angular', 'Vue', 'Node', 'Python', 'Java'].map((tech) => (
              <label key={tech} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="tecnologias"
                  value={tech}
                  checked={formData.tecnologias.includes(tech)}
                  onChange={handleChange}
                />
                {tech}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-1">Nivel</label>
          <select
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
            type="checkbox"
            name="aceptaTerminos"
            id="terminos"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
          />
          <label htmlFor="terminos" className="text-sm text-slate-700">
            Acepto los términos y condiciones del evento
          </label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Agregar participante
          </button>
        </div>
      </form>
    </section>
  );
}

export default Formulario;
