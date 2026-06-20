import axios from "axios";
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});


axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & {
      _retry?: boolean;
      _roleSynced?: boolean;
    };

    // 403 → puede ser que al usuario le hayan cambiado los roles. Resincronizamos
    // los roles reales desde /auth/me: si perdió permisos, ProtectedRoute lo saca
    // de la sección al re-renderizar. (El backend ya rechaza la acción de por sí.)
    if (error.response?.status === 403 && !original._roleSynced) {
      original._roleSynced = true;
      const token = useAuthStore.getState().accessToken;
      if (token) {
        try {
          const { data: user } = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          useAuthStore.getState().setUser(user);
        } catch {
          // si /me falla (p. ej. 401), lo maneja el flujo de 401 en el próximo request
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      // Anónimo (sin sesión): NO forzar /login — el catálogo es público y el
      // routing (ProtectedRoute) ya protege lo que requiere login. Solo se
      // rechaza el error para que lo maneje quien hizo la llamada.
      if (!refreshToken) {
        return Promise.reject(error);
      }

      // Sesión activa: intentar refrescar el access token de forma transparente.
      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return axiosClient(original);
      } catch {
        // El refresh falló → la sesión expiró de verdad: cerrar sesión y al login.
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;