import { useEffect, useState } from 'react';
import { Participante, type ParticipanteData } from './models/Participante';

type FormularioParticipanteData = Omit<ParticipanteData, 'id' | 'edad'> & {
  edad: string;
};

function App() {
  const [participantes, setParticipantes] = useState<Participante[]>(() => {
    const datosGuardados = localStorage.getItem('participantes_evento');

    if (!datosGuardados) {
      return [];
    }

    try {
      const participantesParseados = JSON.parse(datosGuardados) as ParticipanteData[];
      return participantesParseados.map((participante) => Participante.fromJSON(participante));
    } catch {
      return [];
    }
  });
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroNivel, setFiltroNivel] = useState('Todos');

  const [formData, setFormData] = useState<FormularioParticipanteData>({
    nombre: '', email: '', edad: '', pais: '', modalidad: '',
    tecnologias: [], nivel: '', aceptaTerminos: false
  });

  useEffect(() => {
    localStorage.setItem('participantes_evento', JSON.stringify(participantes));
  }, [participantes]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      if (name === 'aceptaTerminos') {
        setFormData({ ...formData, aceptaTerminos: target.checked });
      } else if (name === 'tecnologias') {
        if (target.checked) {
          setFormData({ ...formData, tecnologias: [...formData.tecnologias, value] });
        } else {
          setFormData({ ...formData, tecnologias: formData.tecnologias.filter(t => t !== value) });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aceptaTerminos) {
      alert("Debes aceptar los términos y condiciones");
      return;
    }

    const nuevoParticipante = new Participante({
      id: Date.now(),
      nombre: formData.nombre,
      email: formData.email,
      edad: Number(formData.edad),
      pais: formData.pais,
      modalidad: formData.modalidad,
      tecnologias: formData.tecnologias,
      nivel: formData.nivel,
      aceptaTerminos: formData.aceptaTerminos
    });

    setParticipantes([...participantes, nuevoParticipante]);
    setFormData({
      nombre: '', email: '', edad: '', pais: '', modalidad: '',
      tecnologias: [], nivel: '', aceptaTerminos: false
    });
    alert("¡Participante registrado con éxito!");
  };

  const eliminarParticipante = (id: number) => {
    const confirmacion = window.confirm("¿Estás seguro de que querés eliminar a este participante?");
    if (confirmacion) {
      setParticipantes(participantes.filter(p => p.id !== id));
    }
  };

  const getColorTarjeta = (nivel: string) => {
    switch (nivel) {
      case 'Principiante': return 'bg-green-100'; 
      case 'Intermedio': return 'bg-yellow-100';  
      case 'Avanzado': return 'bg-red-100';       
      default: return 'bg-white';
    }
  };

  const participantesFiltrados = participantes.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    const coincideModalidad = filtroModalidad === 'Todas' || p.modalidad === filtroModalidad;
    const coincideNivel = filtroNivel === 'Todos' || p.nivel === filtroNivel;
    
    return coincideNombre && coincideModalidad && coincideNivel;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Registro de Participantes</h1>

      <div className="mb-4 text-lg font-semibold text-gray-800">
        Participantes registrados: {participantes.length}
      </div>

      <div className="bg-white shadow rounded p-4 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Nombre</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="border p-2 rounded" placeholder="Ej: Juan Perez" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="border p-2 rounded" placeholder="Ej: juan@mail.com" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Edad</label>
            <input type="number" name="edad" value={formData.edad} onChange={handleChange} required className="border p-2 rounded" placeholder="Ej: 25" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">País</label>
            <select name="pais" value={formData.pais} onChange={handleChange} required className="border p-2 rounded bg-white">
              <option value="">Seleccione un país...</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
              <option value="Uruguay">Uruguay</option>
              <option value="México">México</option>
              <option value="España">España</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-2">Modalidad</label>
            <div className="flex gap-4">
              <label><input type="radio" name="modalidad" value="Presencial" checked={formData.modalidad === 'Presencial'} onChange={handleChange} required className="mr-1"/> Presencial</label>
              <label><input type="radio" name="modalidad" value="Virtual" checked={formData.modalidad === 'Virtual'} onChange={handleChange} required className="mr-1"/> Virtual</label>
              <label><input type="radio" name="modalidad" value="Hibrido" checked={formData.modalidad === 'Hibrido'} onChange={handleChange} required className="mr-1"/> Híbrido</label>
            </div>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-semibold mb-2">Tecnologías</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['React', 'Angular', 'Vue', 'Node', 'Python', 'Java'].map(tech => (
                <label key={tech}>
                  <input type="checkbox" name="tecnologias" value={tech} checked={formData.tecnologias.includes(tech)} onChange={handleChange} className="mr-1"/> {tech}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Nivel de Experiencia</label>
            <select name="nivel" value={formData.nivel} onChange={handleChange} required className="border p-2 rounded bg-white">
              <option value="">Seleccione nivel...</option>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>

          <div className="flex items-center md:col-span-2 mt-2">
            <input type="checkbox" name="aceptaTerminos" checked={formData.aceptaTerminos} onChange={handleChange} id="terminos" className="mr-2" />
            <label htmlFor="terminos" className="text-sm text-gray-700">Acepto los términos y condiciones del evento</label>
          </div>

          <div className="md:col-span-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full md:w-auto">
              Registrar
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Buscar" 
          value={filtroNombre} 
          onChange={(e) => setFiltroNombre(e.target.value)} 
          className="border p-2 rounded w-full" 
        />
        
        <select 
          value={filtroModalidad} 
          onChange={(e) => setFiltroModalidad(e.target.value)} 
          className="border p-2 rounded w-full bg-white"
        >
          <option value="Todas">Todas</option>
          <option value="Presencial">Presencial</option>
          <option value="Virtual">Virtual</option>
          <option value="Hibrido">Híbrido</option>
        </select>
        
        <select 
          value={filtroNivel} 
          onChange={(e) => setFiltroNivel(e.target.value)} 
          className="border p-2 rounded w-full bg-white"
        >
          <option value="Todos">Todos</option>
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participantesFiltrados.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">No hay participantes que coincidan con la búsqueda.</p>
        ) : (
          participantesFiltrados.map(participante => (
            <div key={participante.id} className={`${getColorTarjeta(participante.nivel)} shadow rounded p-4 hover:shadow-lg transition flex flex-col justify-between`}>
              <div>
                <h2 className="font-bold text-lg">{participante.nombre}</h2>
                <p className="text-sm text-gray-700 mb-2">{participante.pais}</p>
                <p className="text-sm"><strong>Modalidad:</strong> {participante.modalidad}</p>
                <p className="text-sm"><strong>Nivel:</strong> {participante.nivel}</p>
                <div className="mt-2">
                  <p className="text-sm font-semibold">Tecnologías:</p>
                  <p className="text-sm text-gray-700">{participante.tecnologias.join(' - ')}</p>
                </div>
              </div>
              <button 
                onClick={() => eliminarParticipante(participante.id)}
                className="mt-4 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition self-start"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default App;