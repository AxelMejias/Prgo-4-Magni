import type {
  Categoria,
  CategoriaTree,
  CategoriaInput,
  PaginatedCategorias,
  Ingrediente,
  IngredienteInput,
  ProductoListItem,
  PaginatedProductos,
  ProductoDetalle,
  ProductoCreate,
  ProductoUpdate,
} from "../types";
import { useAuthStore } from "../shared/store/authStore";

const BASE = "http://localhost:8000";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fieldLabels: Record<string, string> = {
  nombre: "Nombre",
  precio: "Precio",
  descripcion: "Descripción",
  unidad_medida: "Unidad de medida",
  categoria_ids: "Categorías",
  ingredientes: "Ingredientes",
};

function parsePydanticMsg(msg: string): string {
  if (/at least \d+ character/.test(msg)) {
    const n = msg.match(/(\d+) character/)?.[1] ?? "2";
    return `Debe tener al menos ${n} caracteres`;
  }
  if (/greater than 0/.test(msg)) return "Debe ser mayor a 0";
  if (/greater than or equal to 0/.test(msg)) return "Debe ser mayor o igual a 0";
  if (/less than or equal to/.test(msg)) {
    const n = msg.match(/to ([\d.]+)/)?.[1] ?? "";
    return `Debe ser menor o igual a ${n}`;
  }
  if (/field required/i.test(msg)) return "Campo requerido";
  return msg;
}

function extractDetail(detail: unknown): string {
  if (typeof detail === "object" && detail !== null && "detail" in detail) {
    return String((detail as Record<string, unknown>).detail);
  }
  if (typeof detail === "string") return detail;
  return "";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    let msg: string;
    if (Array.isArray(body?.detail)) {
      msg = body.detail
        .map((d: { loc: string[]; msg: string }) => {
          const field = d.loc?.[d.loc.length - 1];
          const label = field && field !== "body" ? (fieldLabels[field] ?? field) : null;
          const translated = parsePydanticMsg(d.msg);
          return label ? `${label}: ${translated}` : translated;
        })
        .join("\n");
    } else {
      msg = extractDetail(body?.detail) || `Error ${res.status}`;
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  if (token) return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  return { "Content-Type": "application/json" };
}

function post<T>(url: string, data: unknown): Promise<T> {
  return fetch(`${BASE}${url}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

function put<T>(url: string, data: unknown): Promise<T> {
  return fetch(`${BASE}${url}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

function del(url: string): Promise<void> {
  return fetch(`${BASE}${url}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  }).then((r) => handleResponse<void>(r));
}

function get<T>(url: string): Promise<T> {
  return fetch(`${BASE}${url}`, {
    headers: authHeaders(),
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

// ─── Categorías ──────────────────────────────────────────────────────────────
export const categoriasApi = {
  getAll: () =>
    get<{ items: Categoria[]; total: number }>("/api/v1/categorias/?page=1&size=100").then(
      (r) => r.items
    ),
  getTree: () =>
    get<CategoriaTree[]>("/api/v1/categorias/tree"),
  getPaginated: (page = 1, size = 5) =>
    get<PaginatedCategorias>(`/api/v1/categorias/?page=${page}&size=${size}`),
  getById: (id: number) => get<Categoria>(`/api/v1/categorias/${id}`),
  create: (data: CategoriaInput) => post<Categoria>("/api/v1/categorias/", data),
  update: (id: number, data: CategoriaInput) =>
    put<Categoria>(`/api/v1/categorias/${id}`, data),
  delete: (id: number) => del(`/api/v1/categorias/${id}`),
};

// ─── Admin: Usuarios ──────────────────────────────────────────────────────────
export type UsuarioAdmin = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  celular?: string | null;
  roles: { codigo: string; nombre: string }[];
  created_at: string;
  deleted_at?: string | null;
};

export type PaginatedUsuariosAdmin = {
  items: UsuarioAdmin[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

function delJson<T>(url: string): Promise<T> {
  return fetch(`${BASE}${url}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  }).then((r) => handleResponse<T>(r));
}

export const adminApi = {
  getUsuarios: (page = 1, size = 20, rol_codigo?: string) => {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (rol_codigo) qs.set("rol_codigo", rol_codigo);
    return get<PaginatedUsuariosAdmin>(`/api/v1/admin/usuarios?${qs}`);
  },
  asignarRol: (usuarioId: number, rolCodigo: string) =>
    post<UsuarioAdmin>(`/api/v1/admin/usuarios/${usuarioId}/roles`, { rol_codigo: rolCodigo }),
  removerRol: (usuarioId: number, rolCodigo: string) =>
    delJson<UsuarioAdmin>(`/api/v1/admin/usuarios/${usuarioId}/roles/${rolCodigo}`),
  deleteUsuario: (usuarioId: number) =>
    del(`/api/v1/admin/usuarios/${usuarioId}`),
};

// ─── Ingredientes ─────────────────────────────────────────────────────────────
export const ingredientesApi = {
  getAll: () =>
    get<{ items: Ingrediente[] }>("/api/v1/ingredientes/?page=1&size=100").then(
      (r) => r.items
    ),
  getById: (id: number) => get<Ingrediente>(`/api/v1/ingredientes/${id}`),
  create: (data: IngredienteInput) => post<Ingrediente>("/api/v1/ingredientes/", data),
  update: (id: number, data: IngredienteInput) =>
    put<Ingrediente>(`/api/v1/ingredientes/${id}`, data),
  delete: (id: number) => del(`/api/v1/ingredientes/${id}`),
};

// ─── Productos ────────────────────────────────────────────────────────────────
export const productosApi = {
  getAll: (
    page = 1,
    size = 20,
    params?: { nombre?: string; solo_disponibles?: boolean }
  ) => {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (params?.nombre) qs.set("nombre", params.nombre);
    if (params?.solo_disponibles !== undefined)
      qs.set("solo_disponibles", String(params.solo_disponibles));
    return get<PaginatedProductos>(`/api/v1/productos/?${qs}`);
  },
  getAllForSelect: () =>
    get<PaginatedProductos>(
      "/api/v1/productos/?page=1&size=100&solo_disponibles=false"
    ).then((r) => r.items),
  getById: (id: number) => get<ProductoDetalle>(`/api/v1/productos/${id}`),
  create: (data: ProductoCreate) => post<ProductoDetalle>("/api/v1/productos/", data),
  update: (id: number, data: ProductoUpdate) =>
    put<ProductoDetalle>(`/api/v1/productos/${id}`, data),
  delete: (id: number) => del(`/api/v1/productos/${id}`),

  getInactivos: (page = 1, size = 20) =>
    get<PaginatedProductos>(`/api/v1/productos/inactivos?page=${page}&size=${size}`),

  reactivar: (id: number) =>
    fetch(`${BASE}/api/v1/productos/${id}/reactivar`, {
      method: "PATCH",
      headers: authHeaders(),
      credentials: "include",
    }).then((r) => handleResponse<ProductoDetalle>(r)),
};