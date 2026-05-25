/**
 * authStore.test.ts — Tests para src/shared/store/authStore.ts
 *
 * Cubre: login, logout, setTokens, hasRole.
 *
 * Estrategia: getState() / setState() directamente (Zustand v5 unit test pattern).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import type { User } from "../types/auth";

// ── helpers ────────────────────────────────────────────────────────────────

function makeUser(roles: string[] = []): User {
  return {
    id: 1,
    nombre: "Test",
    apellido: "User",
    email: "test@example.com",
    roles: roles.map((codigo) => ({ codigo, nombre: codigo })),
  };
}

function resetStore() {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
}

// ── tests ──────────────────────────────────────────────────────────────────

describe("authStore", () => {
  beforeEach(resetStore);

  // -------------------------------------------------------------------------
  // Estado inicial
  // -------------------------------------------------------------------------
  describe("estado inicial", () => {
    it("empieza sin sesión activa", () => {
      const { isAuthenticated, user, accessToken } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(user).toBeNull();
      expect(accessToken).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  describe("login", () => {
    it("establece tokens y usuario, marca isAuthenticated = true", () => {
      const user = makeUser(["CLIENT"]);
      useAuthStore.getState().login("access_tok", "refresh_tok", user);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe("access_tok");
      expect(state.refreshToken).toBe("refresh_tok");
      expect(state.user).toEqual(user);
    });
  });

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------
  describe("logout", () => {
    it("borra tokens, usuario y marca isAuthenticated = false", () => {
      const user = makeUser(["ADMIN"]);
      useAuthStore.getState().login("tok", "ref", user);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // setTokens
  // -------------------------------------------------------------------------
  describe("setTokens", () => {
    it("reemplaza ambos tokens sin tocar user ni isAuthenticated", () => {
      const user = makeUser(["CLIENT"]);
      useAuthStore.getState().login("old_access", "old_refresh", user);

      useAuthStore.getState().setTokens("new_access", "new_refresh");

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("new_access");
      expect(state.refreshToken).toBe("new_refresh");
      expect(state.isAuthenticated).toBe(true);   // no se tocó
      expect(state.user).toEqual(user);            // no se tocó
    });
  });

  // -------------------------------------------------------------------------
  // hasRole
  // -------------------------------------------------------------------------
  describe("hasRole", () => {
    it("retorna false si no hay usuario logueado", () => {
      expect(useAuthStore.getState().hasRole(["ADMIN"])).toBe(false);
    });

    it("retorna true si el usuario tiene el rol exacto", () => {
      useAuthStore.getState().login("t", "r", makeUser(["ADMIN"]));
      expect(useAuthStore.getState().hasRole(["ADMIN"])).toBe(true);
    });

    it("retorna true si el usuario tiene al menos uno de varios roles pedidos", () => {
      useAuthStore.getState().login("t", "r", makeUser(["STOCK"]));
      expect(useAuthStore.getState().hasRole(["ADMIN", "STOCK"])).toBe(true);
    });

    it("retorna false si el usuario no tiene ninguno de los roles pedidos", () => {
      useAuthStore.getState().login("t", "r", makeUser(["CLIENT"]));
      expect(useAuthStore.getState().hasRole(["ADMIN", "COCINERO"])).toBe(false);
    });

    it("retorna false con lista vacía de roles requeridos", () => {
      useAuthStore.getState().login("t", "r", makeUser(["ADMIN"]));
      expect(useAuthStore.getState().hasRole([])).toBe(false);
    });

    it("retorna false después de logout aunque antes tenía rol", () => {
      useAuthStore.getState().login("t", "r", makeUser(["ADMIN"]));
      expect(useAuthStore.getState().hasRole(["ADMIN"])).toBe(true);

      useAuthStore.getState().logout();
      expect(useAuthStore.getState().hasRole(["ADMIN"])).toBe(false);
    });

    it("compara por código exacto (case-sensitive)", () => {
      useAuthStore.getState().login("t", "r", makeUser(["ADMIN"]));
      expect(useAuthStore.getState().hasRole(["admin"])).toBe(false);
    });

    it("usuario con múltiples roles — cualquiera hace match", () => {
      useAuthStore.getState().login("t", "r", makeUser(["CLIENT", "COCINERO"]));
      expect(useAuthStore.getState().hasRole(["COCINERO"])).toBe(true);
    });
  });
});
