import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./components/Layout";
import ProtectedRoute from "./shared/ui/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import CategoriasPage from "./pages/CategoriasPage";
import IngredientesPage from "./pages/IngredientesPage";
import ProductosPage from "./pages/ProductosPage";
import ProductoDetallePage from "./pages/ProductoDetallePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas — requieren login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/productos" replace />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route path="/ingredientes" element={<IngredientesPage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/productos/:id" element={<ProductoDetallePage />} />
              <Route
                path="/sin-permisos"
                element={
                  <div className="p-8 text-center text-red-600 font-semibold">
                    No tenés permisos para acceder a esta sección.
                  </div>
                }
              />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
