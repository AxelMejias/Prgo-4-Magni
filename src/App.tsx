// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./components/Layout";
import ProtectedRoute from "./shared/ui/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Admin / Catálogo
import CategoriasPage from "./pages/CategoriasPage";
import IngredientesPage from "./pages/IngredientesPage";
import ProductosPage from "./pages/ProductosPage";
import ProductoDetallePage from "./pages/ProductoDetallePage";

// Store (Cliente)
import HomeStorePage from "./pages/HomeStorePage";
import CarritoPage from "./pages/CarritoPage";
import CheckoutPage from "./pages/CheckoutPage";
import MisPedidosPage from "./pages/MisPedidosPage";
import PedidoDetallePage from "./pages/PedidoDetallePage";

// Admin Pedidos (Staff)
import AdminPedidosPage from "./pages/AdminPedidosPage";

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
          {/* ── Públicas ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Protegidas: autenticado ─────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Default landing — depende del rol; lo dejamos en /tienda y
                  el Layout se encarga de mostrar lo que cada rol puede ver */}
              <Route index element={<Navigate to="/tienda" replace />} />

              {/* Store — accesible por todos los autenticados */}
              <Route path="/tienda"     element={<HomeStorePage />} />
              <Route path="/carrito"    element={<CarritoPage />} />
              <Route path="/checkout"   element={<CheckoutPage />} />
              <Route path="/mis-pedidos"        element={<MisPedidosPage />} />
              <Route path="/mis-pedidos/:id"    element={<PedidoDetallePage />} />

              {/* Admin Pedidos — solo ADMIN/PEDIDOS */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PEDIDOS"]} />}>
                <Route path="/admin/pedidos"      element={<AdminPedidosPage />} />
                <Route path="/admin/pedidos/:id"  element={<PedidoDetallePage />} />
              </Route>

              {/* Admin catálogo (P1) — solo ADMIN/STOCK */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/categorias" element={<CategoriasPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "STOCK"]} />}>
                <Route path="/ingredientes" element={<IngredientesPage />} />
                <Route path="/productos"    element={<ProductosPage />} />
                <Route path="/productos/:id" element={<ProductoDetallePage />} />
              </Route>

              <Route
                path="/sin-permisos"
                element={
                  <div className="p-8 text-center text-danger-600 font-semibold">
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