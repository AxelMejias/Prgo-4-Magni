import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./components/Layout";
import StoreLayout from "./components/StoreLayout";
import ProtectedRoute from "./shared/ui/ProtectedRoute";
import { useAuthStore } from "./shared/store/authStore";

import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Admin / Catálogo
import CategoriasPage from "./pages/CategoriasPage";
import IngredientesPage from "./pages/IngredientesPage";
import ProductosPage from "./pages/ProductosPage";
import ProductoDetallePage from "./pages/ProductoDetallePage";

// Store front (CLIENT)
import StorePage from "./pages/StorePage";
import CarritoPage from "./pages/CarritoPage";
import CheckoutPage from "./pages/CheckoutPage";
import MisPedidosPage from "./pages/MisPedidosPage";
import MisDireccionesPage from "./pages/MisDireccionesPage";
import PedidoDetallePage from "./pages/PedidoDetallePage";
import PedidoExitosoPage from "./pages/PedidoExitosoPage";

// Admin Pedidos (Staff)
import AdminPedidosPage from "./pages/AdminPedidosPage";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import DashboardPage from "./pages/DashboardPage";
function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  // Anónimo → tienda pública (catálogo navegable sin login, doc §5.2 / OBJ-01).
  if (!isAuthenticated)            return <Navigate to="/store" replace />;
  if (hasRole(["ADMIN", "STOCK"])) return <Navigate to="/productos" replace />;
  if (hasRole(["PEDIDOS"]))        return <Navigate to="/admin/pedidos" replace />;
  return <Navigate to="/store" replace />;
}

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
          {/* ── Públicas ──────────────────────────────────────── */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />

          {/* Raíz: anónimo → tienda; logueado → destino por rol */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── Store front PÚBLICO — catálogo navegable sin login (doc §5.2) ── */}
          <Route element={<StoreLayout />}>
            <Route path="/store" element={<StorePage />} />

            {/* Rutas exclusivas CLIENT (requieren login) */}
            <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
              <Route path="/carrito"        element={<CarritoPage />} />
              <Route path="/checkout"       element={<CheckoutPage />} />
              <Route path="/mis-pedidos"    element={<MisPedidosPage />} />
              <Route path="/mis-pedidos/:id" element={<PedidoDetallePage />} />
              <Route path="/mis-direcciones" element={<MisDireccionesPage />} />
              <Route path="/pedido-exitoso" element={<PedidoExitosoPage />} />
            </Route>
          </Route>

          {/* ── Panel admin PROTEGIDO — Layout con sidebar ──────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Admin Pedidos — ADMIN / PEDIDOS */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PEDIDOS"]} />}>
                <Route path="/admin/pedidos"     element={<AdminPedidosPage />} />
                <Route path="/admin/pedidos/:id" element={<PedidoDetallePage />} />
              </Route>

              {/* Admin Usuarios + Dashboard — ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
                <Route path="/categorias"     element={<CategoriasPage />} />
              </Route>

              {/* Catálogo admin — ADMIN / STOCK */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "STOCK"]} />}>
                <Route path="/ingredientes"  element={<IngredientesPage />} />
                <Route path="/productos"     element={<ProductosPage />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
