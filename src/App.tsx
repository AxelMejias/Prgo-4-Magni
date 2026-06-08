import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./components/Layout";
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

// Store (Cliente)
import InicioPage from "./pages/InicioPage";
import TiendaPage from "./pages/TiendaPage";
import CarritoPage from "./pages/CarritoPage";
import CheckoutPage from "./pages/CheckoutPage";
import MisPedidosPage from "./pages/MisPedidosPage";
import MisDireccionesPage from "./pages/MisDireccionesPage";
import PedidoDetallePage from "./pages/PedidoDetallePage";

// Admin Pedidos (Staff)
import AdminPedidosPage from "./pages/AdminPedidosPage";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import PedidoExitosoPage from "./pages/PedidoExitosoPage";
import MpCheckoutRedirectPage from "./pages/MpCheckoutRedirectPage";

function SmartRedirect() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (hasRole(["ADMIN", "STOCK"])) return <Navigate to="/productos" replace />;
  if (hasRole(["PEDIDOS"]))        return <Navigate to="/admin/pedidos" replace />;
  return <Navigate to="/inicio" replace />;
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
          {/* ── Públicas ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Públicas: flujo de MercadoPago ─────────────────────────── */}
          <Route path="/mp-checkout-redirect" element={<MpCheckoutRedirectPage />} />
          <Route element={<Layout />}>
            <Route path="/pedido-exitoso" element={<PedidoExitosoPage />} />
          </Route>

          {/* ── Protegidas: autenticado ─────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<SmartRedirect />} />

              {/* Store — accesible por todos los autenticados */}
              <Route path="/inicio"     element={<InicioPage />} />
              <Route path="/tienda"     element={<TiendaPage />} />
              <Route path="/carrito"    element={<CarritoPage />} />
              <Route path="/checkout"   element={<CheckoutPage />} />
              <Route path="/mis-pedidos"     element={<MisPedidosPage />} />
              <Route path="/mis-pedidos/:id" element={<PedidoDetallePage />} />

              {/* ← NUEVO: Direcciones solo para CLIENT */}
              <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
                <Route path="/mis-direcciones" element={<MisDireccionesPage />} />
              </Route>

              {/* Admin Pedidos — solo ADMIN/PEDIDOS */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "PEDIDOS"]} />}>
                <Route path="/admin/pedidos"     element={<AdminPedidosPage />} />
                <Route path="/admin/pedidos/:id" element={<PedidoDetallePage />} />
              </Route>

              {/* Admin Usuarios — solo ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
              </Route>

              {/* Admin catálogo (P1) — solo ADMIN/STOCK */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/categorias" element={<CategoriasPage />} />
              </Route>
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