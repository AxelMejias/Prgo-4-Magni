import type {
  Categoria,
  CategoriaInput,
  Ingrediente,
  IngredienteInput,
  ProductoListItem,
  ProductoDetalle,
  ProductoCreate,
  ProductoUpdate,
} from "../types";
import { useAuthStore } from "../shared/store/authStore";

const BASE = "http://localhost:8000";

// ─── helpers ─────────────────────────────────────────────
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
  // RFC 7807: detail es un objeto { detail: "...", code: "..." }
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
  }).then((r) => handleResponse<T>(r));
}

function put<T>(url: string, data: unknown): Promise<T> {
  return fetch(`${BASE}${url}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then((r) => handleResponse<T>(r));
}

function del(url: string): Promise<void> {
  return fetch(`${BASE}${url}`, { method: "DELETE", headers: authHeaders() }).then((r) =>
    handleResponse<void>(r)
  );
}

function get<T>(url: string): Promise<T> {
  return fetch(`${BASE}${url}`, { headers: authHeaders() }).then((r) => handleResponse<T>(r));
}

// ─── Categorías ──────────────────────────────────────────
export const categoriasApi = {
  getAll: () => get<Categoria[]>("/categorias/"),
  getById: (id: number) => get<Categoria>(`/categorias/${id}`),
  create: (data: CategoriaInput) => post<Categoria>("/categorias/", data),
  update: (id: number, data: CategoriaInput) => put<Categoria>(`/categorias/${id}`, data),
  delete: (id: number) => del(`/categorias/${id}`),
};

// ─── Ingredientes — apunta a la nueva URL con paginación ─
export const ingredientesApi = {
  getAll: () =>
    get<{ items: Ingrediente[] }>("/api/v1/ingredientes/?page=1&size=100").then((r) => r.items),
  getById: (id: number) => get<Ingrediente>(`/api/v1/ingredientes/${id}`),
  create: (data: IngredienteInput) => post<Ingrediente>("/api/v1/ingredientes/", data),
  update: (id: number, data: IngredienteInput) =>
    put<Ingrediente>(`/api/v1/ingredientes/${id}`, data),
  delete: (id: number) => del(`/api/v1/ingredientes/${id}`),
};

// ─── Productos ───────────────────────────────────────────
export const productosApi = {
  getAll: () => get<ProductoListItem[]>("/productos/"),
  getById: (id: number) => get<ProductoDetalle>(`/productos/${id}`),
  create: (data: ProductoCreate) => post<ProductoDetalle>("/productos/", data),
  update: (id: number, data: ProductoUpdate) => put<ProductoDetalle>(`/productos/${id}`, data),
  delete: (id: number) => del(`/productos/${id}`),
};
