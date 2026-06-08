// --- Categoría ---
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaTree {
  id: number;
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
  children: CategoriaTree[];
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
  parent_id?: number | null;
}

export interface PaginatedCategorias {
  items: Categoria[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// --- Ingrediente / Insumo ---
export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  es_alergeno: boolean;
  costo_unitario: number;
  stock_cantidad: number;
  stock_minimo: number;
  es_producto_terminado: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface IngredienteInput {
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  es_alergeno?: boolean;
  costo_unitario?: number;
  stock_cantidad?: number;
  stock_minimo?: number;
  es_producto_terminado?: boolean;
}

// --- Sub-schemas de Producto ---
export interface InsumoEnProducto {
  ingrediente_id: number;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  subtotal: number;
  stock_actual: number;
  es_producto_terminado: boolean;
}

export interface InsumoEnProductoInput {
  ingrediente_id: number;
  cantidad: number;
}

// --- Producto ---
export interface ProductoListItem {
  id: number;
  nombre: string;
  descripcion?: string;
  image_url?: string | null;
  precio: number;
  margen_ganancia: number;
  costo_total_insumos: number;
  disponible: boolean;
  categorias: Categoria[];
  insumos: InsumoEnProducto[];
  created_at: string;
  updated_at?: string;
}

export interface PaginatedProductos {
  items: ProductoListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProductoDetalle extends ProductoListItem {}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  image_url?: string | null;
  margen_ganancia: number;
  disponible?: boolean;
  categoria_ids: number[];
  insumos: InsumoEnProductoInput[];
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  image_url?: string | null;
  margen_ganancia?: number;
  disponible?: boolean;
  categoria_ids?: number[];
  insumos?: InsumoEnProductoInput[];
}

// --- Error de stock insuficiente ---
export interface InsumoFaltante {
  insumo_id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_requerido: number;
  deficit: number;
}

export interface StockInsuficienteError {
  detail: string;
  code: "STOCK_INSUFICIENTE";
  faltantes: InsumoFaltante[];
}