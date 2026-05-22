import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import type { ParticipanteData } from '../models/Participante';
import { useParticipantes } from '../context/ParticipantesContext';

type FormularioData = Omit<ParticipanteData, 'id' | 'edad'> & { edad: string };

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

export function useFormulario(onSuccess?: () => void) {
  const { agregar, editar, participanteEnEdicion, seleccionar } = useParticipantes();
  const [formData, setFormData] = useState<FormularioData>(estadoInicial);

  useEffect(() => {
    if (participanteEnEdicion) {
      setFormData({ ...participanteEnEdicion, edad: String(participanteEnEdicion.edad) });
    } else {
      setFormData(estadoInicial);
    }
  }, [participanteEnEdicion]);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.aceptaTerminos) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    const datos = {
      nombre: formData.nombre,
      email: formData.email,
      edad: Number(formData.edad),
      pais: formData.pais,
      modalidad: formData.modalidad,
      tecnologias: formData.tecnologias,
      nivel: formData.nivel,
      aceptaTerminos: formData.aceptaTerminos,
    };

    if (participanteEnEdicion) {
      await editar({ id: participanteEnEdicion.id, ...datos });
    } else {
      await agregar(datos);
      setFormData(estadoInicial);
    }

    onSuccess?.();
  };

  const handleCancelar = () => {
    seleccionar(null);
    onSuccess?.();
  };

  const modoEdicion = participanteEnEdicion !== null;

  return { formData, handleChange, handleSubmit, handleCancelar, modoEdicion };
}
