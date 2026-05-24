export interface Direccion {
  id: number;
  usuario_id: number;
  alias?: string | null;
  linea1: string;
  linea2?: string | null;
  ciudad: string;
  provincia?: string | null;
  codigo_postal?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  es_principal: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PaginatedDirecciones {
  items: Direccion[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DireccionCreate {
  alias?: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  provincia?: string;
  codigo_postal?: string;
  es_principal?: boolean;
}