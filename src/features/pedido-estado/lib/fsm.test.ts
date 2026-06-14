/**
 * fsm.test.ts — Tests para src/features/pedido-estado/lib/fsm.ts
 *
 * Cubre: TRANSICIONES_STAFF, TRANSICIONES_CLIENT,
 *        getNextStates, requiereMotivo, ESTADO_LABELS.
 */
import { describe, it, expect } from "vitest";
import {
  TRANSICIONES_STAFF,
  TRANSICIONES_CLIENT,
  getNextStates,
  requiereMotivo,
  ESTADO_LABELS,
} from "./fsm";

// ---------------------------------------------------------------------------
// TRANSICIONES_STAFF
// ---------------------------------------------------------------------------
describe("TRANSICIONES_STAFF", () => {
  it("PENDIENTE puede ir a CONFIRMADO y CANCELADO", () => {
    expect(TRANSICIONES_STAFF.PENDIENTE).toEqual(
      expect.arrayContaining(["CONFIRMADO", "CANCELADO"])
    );
    expect(TRANSICIONES_STAFF.PENDIENTE).toHaveLength(2);
  });

  it("CONFIRMADO puede ir a EN_PREP y CANCELADO", () => {
    expect(TRANSICIONES_STAFF.CONFIRMADO).toEqual(
      expect.arrayContaining(["EN_PREP", "CANCELADO"])
    );
    expect(TRANSICIONES_STAFF.CONFIRMADO).toHaveLength(2);
  });

  it("EN_PREP puede ir a ENTREGADO y CANCELADO", () => {
    expect(TRANSICIONES_STAFF.EN_PREP).toEqual(
      expect.arrayContaining(["ENTREGADO", "CANCELADO"])
    );
    expect(TRANSICIONES_STAFF.EN_PREP).toHaveLength(2);
  });

  it("ENTREGADO es estado terminal — sin transiciones", () => {
    expect(TRANSICIONES_STAFF.ENTREGADO).toHaveLength(0);
  });

  it("CANCELADO es estado terminal — sin transiciones", () => {
    expect(TRANSICIONES_STAFF.CANCELADO).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TRANSICIONES_CLIENT
// ---------------------------------------------------------------------------
describe("TRANSICIONES_CLIENT", () => {
  it("PENDIENTE → solo CANCELADO", () => {
    expect(TRANSICIONES_CLIENT.PENDIENTE).toEqual(["CANCELADO"]);
  });

  it("CONFIRMADO → solo CANCELADO", () => {
    expect(TRANSICIONES_CLIENT.CONFIRMADO).toEqual(["CANCELADO"]);
  });

  it("EN_PREP → sin opciones (no puede cancelar una vez en preparación)", () => {
    expect(TRANSICIONES_CLIENT.EN_PREP).toHaveLength(0);
  });

  it("ENTREGADO → sin opciones", () => {
    expect(TRANSICIONES_CLIENT.ENTREGADO).toHaveLength(0);
  });

  it("CANCELADO → sin opciones", () => {
    expect(TRANSICIONES_CLIENT.CANCELADO).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getNextStates
// ---------------------------------------------------------------------------
describe("getNextStates", () => {
  describe("esStaff = true", () => {
    it("retorna transiciones staff para PENDIENTE", () => {
      expect(getNextStates("PENDIENTE", true)).toEqual(
        TRANSICIONES_STAFF.PENDIENTE
      );
    });

    it("retorna transiciones staff para EN_PREP", () => {
      expect(getNextStates("EN_PREP", true)).toEqual(
        TRANSICIONES_STAFF.EN_PREP
      );
    });

    it("retorna [] para estado terminal ENTREGADO", () => {
      expect(getNextStates("ENTREGADO", true)).toHaveLength(0);
    });

    it("retorna [] para estado terminal CANCELADO", () => {
      expect(getNextStates("CANCELADO", true)).toHaveLength(0);
    });
  });

  describe("esStaff = false (cliente)", () => {
    it("retorna [CANCELADO] para PENDIENTE", () => {
      expect(getNextStates("PENDIENTE", false)).toEqual(["CANCELADO"]);
    });

    it("retorna [CANCELADO] para CONFIRMADO", () => {
      expect(getNextStates("CONFIRMADO", false)).toEqual(["CANCELADO"]);
    });

    it("retorna [] para EN_PREP (cliente no puede cancelar)", () => {
      expect(getNextStates("EN_PREP", false)).toHaveLength(0);
    });

    it("retorna [] para ENTREGADO", () => {
      expect(getNextStates("ENTREGADO", false)).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// requiereMotivo
// ---------------------------------------------------------------------------
describe("requiereMotivo", () => {
  it("devuelve true solo para CANCELADO", () => {
    expect(requiereMotivo("CANCELADO")).toBe(true);
  });

  it("devuelve false para CONFIRMADO", () => {
    expect(requiereMotivo("CONFIRMADO")).toBe(false);
  });

  it("devuelve false para EN_PREP", () => {
    expect(requiereMotivo("EN_PREP")).toBe(false);
  });

  it("devuelve false para ENTREGADO", () => {
    expect(requiereMotivo("ENTREGADO")).toBe(false);
  });

  it("devuelve false para PENDIENTE", () => {
    expect(requiereMotivo("PENDIENTE")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ESTADO_LABELS
// ---------------------------------------------------------------------------
describe("ESTADO_LABELS", () => {
  it("tiene etiqueta para todos los estados del FSM", () => {
    const estados = [
      "PENDIENTE",
      "CONFIRMADO",
      "EN_PREP",
      "ENTREGADO",
      "CANCELADO",
    ] as const;

    for (const estado of estados) {
      expect(ESTADO_LABELS[estado]).toBeTruthy();
      expect(typeof ESTADO_LABELS[estado]).toBe("string");
    }
  });

  it("la etiqueta de CANCELADO contiene la palabra 'Cancelado'", () => {
    expect(ESTADO_LABELS.CANCELADO).toBe("Cancelado");
  });

  it("la etiqueta de EN_PREP contiene la palabra 'preparación'", () => {
    expect(ESTADO_LABELS.EN_PREP).toContain("preparación");
  });
});
