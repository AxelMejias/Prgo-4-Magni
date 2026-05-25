import axiosClient from "../../shared/api/axiosClient";
import type {
  Ingrediente,
  PaginatedIngredientes,
  IngredienteCreate,
  IngredienteUpdate,
  IngredienteFilters,
  ImportarResult,
} from "./model";

const fieldLabels: Record<string, string> = {
  nombre: "Nombre",
  unidad_medida: "Unidad de medida",
  descripcion: "Descripción",
  es_alergeno: "Es alérgeno",
};

function parsePydanticMsg(msg: string): string {
  if (/at least \d+ character/.test(msg)) {
    const n = msg.match(/(\d+) character/)?.[1] ?? "2";
    return `Debe tener al menos ${n} caracteres`;
  }
  if (/greater than 0/.test(msg)) return "Debe ser mayor a 0";
  if (/greater than or equal to 0/.test(msg)) return "Debe ser mayor o igual a 0";
  if (/field required/i.test(msg)) return "Campo requerido";
  return msg;
}

function extractMsg(error: unknown): Error {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosErr = error as { response?: { data?: { detail?: unknown } } };
    const detail = axiosErr.response?.data?.detail;
    if (Array.isArray(detail)) {
      const msg = detail
        .map((d: { loc: string[]; msg: string }) => {
          const field = d.loc?.[d.loc.length - 1];
          const label = field && field !== "body" ? (fieldLabels[field] ?? field) : null;
          return label ? `${label}: ${parsePydanticMsg(d.msg)}` : parsePydanticMsg(d.msg);
        })
        .join("\n");
      return new Error(msg);
    }
    if (typeof detail === "string") return new Error(detail);
    if (typeof detail === "object" && detail !== null && "detail" in detail) {
      return new Error(String((detail as Record<string, unknown>).detail));
    }
  }
  return error instanceof Error ? error : new Error("Error inesperado");
}

export const ingredienteApi = {
  getAll: async (filters: IngredienteFilters): Promise<PaginatedIngredientes> => {
    const params: Record<string, unknown> = { page: filters.page, size: filters.size };
    if (filters.nombre) params.nombre = filters.nombre;
    if (filters.es_alergeno !== undefined) params.es_alergeno = filters.es_alergeno;
    const { data } = await axiosClient.get("/api/v1/ingredientes/", { params });
    return data;
  },

  getById: async (id: number): Promise<Ingrediente> => {
    const { data } = await axiosClient.get(`/api/v1/ingredientes/${id}`);
    return data;
  },

  create: async (payload: IngredienteCreate): Promise<Ingrediente> => {
    try {
      const { data } = await axiosClient.post("/api/v1/ingredientes/", payload);
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  update: async (id: number, payload: IngredienteUpdate): Promise<Ingrediente> => {
    try {
      const { data } = await axiosClient.put(`/api/v1/ingredientes/${id}`, payload);
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  softDelete: async (id: number): Promise<void> => {
    try {
      await axiosClient.delete(`/api/v1/ingredientes/${id}`);
    } catch (err) {
      throw extractMsg(err);
    }
  },

  exportToExcel: async (): Promise<void> => {
    const response = await axiosClient.get("/api/v1/ingredientes/exportar", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ingredientes.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  },

  getInactivos: async (page = 1, size = 20): Promise<PaginatedIngredientes> => {
    const { data } = await axiosClient.get("/api/v1/ingredientes/inactivos", {
      params: { page, size },
    });
    return data;
  },

  reactivar: async (id: number): Promise<Ingrediente> => {
    try {
      const { data } = await axiosClient.patch(`/api/v1/ingredientes/${id}/reactivar`);
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  importarExcel: async (file: File): Promise<ImportarResult> => {
    try {
      const form = new FormData();
      form.append("archivo", file);
      const { data } = await axiosClient.post("/api/v1/ingredientes/importar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  descargarPlantilla: async (): Promise<void> => {
    const response = await axiosClient.get("/api/v1/ingredientes/plantilla", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_ingredientes.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  },
};
