/// <reference types="vite/client" />

// Tipado de las variables de entorno del frontend (doc §14.1 / .env.example).
interface ImportMetaEnv {
  /** URL base del backend FastAPI. Ej: http://localhost:8000 */
  readonly VITE_API_URL: string;
  /** Client ID de Google OAuth (público) para el login con Google. */
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
