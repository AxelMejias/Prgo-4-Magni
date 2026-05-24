import axiosClient from "../../shared/api/axiosClient";
import type {
  Direccion,
  PaginatedDirecciones,
  DireccionCreate,
} from "./model";

function extractMsg(error: unknown): Error {
  if (typeof error === "object" && error !== null && "response" in error) {
    const ax = error as { response?: { data?: { detail?: unknown } } };
    const detail = ax.response?.data?.detail;
    if (typeof detail === "string") return new Error(detail);
    if (typeof detail === "object" && detail !== null && "detail" in detail) {
      return new Error(String((detail as Record<string, unknown>).detail));
    }
  }
  return error instanceof Error ? error : new Error("Error inesperado");
}

export type DireccionUpdate = Partial<DireccionCreate>;

export const direccionApi = {
  getAll: async (page = 1, size = 50): Promise<PaginatedDirecciones> => {
    const { data } = await axiosClient.get<PaginatedDirecciones>(
      "/api/v1/direcciones/",
      { params: { page, size } }
    );
    return data;
  },

  getById: async (id: number): Promise<Direccion> => {
    const { data } = await axiosClient.get<Direccion>(
      `/api/v1/direcciones/${id}`
    );
    return data;
  },

  create: async (payload: DireccionCreate): Promise<Direccion> => {
    try {
      const { data } = await axiosClient.post<Direccion>(
        "/api/v1/direcciones/",
        payload
      );
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  update: async (id: number, payload: DireccionUpdate): Promise<Direccion> => {
    try {
      const { data } = await axiosClient.put<Direccion>(
        `/api/v1/direcciones/${id}`,
        payload
      );
      return data;
    } catch (err) {
      throw extractMsg(err);
    }
  },

  marcarPrincipal: async (id: number): Promise<Direccion> => {
    const { data } = await axiosClient.patch<Direccion>(
      `/api/v1/direcciones/${id}/principal`
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    try {
      await axiosClient.delete(`/api/v1/direcciones/${id}`);
    } catch (err) {
      throw extractMsg(err);
    }
  },
};