import { useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../shared/store/authStore";
import { useCartStore } from "../features/cart/model/cartStore";
import { authApi } from "../shared/api/authApi";

export default function StoreLayout() {
  const navigate = useNavigate();
  const user        = useAuthStore((s) => s.user);
  const logout      = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasRole     = useAuthStore((s) => s.hasRole);
  const totalItems  = useCartStore((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);

  const isClient = hasRole(["CLIENT"]);

  async function handleLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-surface-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link
            to="/store"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 shrink-0 mr-2"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/30">
              <span className="text-white font-bold text-xs">FS</span>
            </div>
            <span className="font-bold text-surface-900 tracking-tight hidden sm:block">
              Food Store
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/store"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-brand-700 bg-brand-50"
                    : "text-surface-600 hover:text-brand-700 hover:bg-brand-50"
                }`
              }
            >
              Inicio
            </NavLink>
            {isClient && (
              <NavLink
                to="/mis-pedidos"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-brand-700 bg-brand-50"
                      : "text-surface-600 hover:text-brand-700 hover:bg-brand-50"
                  }`
                }
              >
                Mis pedidos
              </NavLink>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Cart — solo para CLIENT */}
          {isClient && (
            <Link
              to="/carrito"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-100 transition-colors"
            >
              <span className="text-lg leading-none">🛒</span>
              <span className="hidden sm:block">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {/* User dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.nombre[0]}{user.apellido[0]}
                </div>
                <span className="text-sm font-medium text-surface-700 hidden sm:block max-w-[100px] truncate">
                  {user.nombre}
                </span>
                <span className="text-surface-400 text-xs">▾</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-surface-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-100">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="text-xs text-surface-500 truncate">{user.email}</p>
                    </div>

                    {isClient && (
                      <>
                        <Link
                          to="/mis-pedidos"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                        >
                          <span>📋</span> Mis pedidos
                        </Link>
                        <Link
                          to="/mis-direcciones"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                        >
                          <span>📍</span> Mis direcciones
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors border-t border-surface-100"
                    >
                      <span>↩</span> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────── */}
      <main className="flex-1 animate-page">
        <Outlet />
      </main>

    </div>
  );
}
