export interface ParticipanteData {
  id: number;
  nombre: string;
  email: string;
  edad: number;
  pais: string;
  modalidad: string;
  tecnologias: string[];
  nivel: string;
  aceptaTerminos: boolean;
}

export class Participante {
  id: number;
  nombre: string;
  email: string;
  edad: number;
  pais: string;
  modalidad: string;
  tecnologias: string[];
  nivel: string;
  aceptaTerminos: boolean;

  constructor(data: ParticipanteData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.email = data.email;
    this.edad = data.edad;
    this.pais = data.pais;
    this.modalidad = data.modalidad;
    this.tecnologias = data.tecnologias;
    this.nivel = data.nivel;
    this.aceptaTerminos = data.aceptaTerminos;
  }

  static fromJSON(data: ParticipanteData): Participante {
    return new Participante(data);
  }
}
