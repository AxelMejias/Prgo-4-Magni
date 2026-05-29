export interface CategoriaTree {
  id: number;
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
  children: CategoriaTree[];
}