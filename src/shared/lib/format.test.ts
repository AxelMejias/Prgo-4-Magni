/**
 * format.test.ts — Tests para src/shared/lib/format.ts
 *
 * Cubre: toNumber, formatARS, formatDateTime.
 */
import { describe, it, expect } from "vitest";
import { toNumber, formatARS, formatDateTime } from "./format";

// ---------------------------------------------------------------------------
// toNumber
// ---------------------------------------------------------------------------
describe("toNumber", () => {
  it("devuelve el número tal cual si ya es number", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(3.14)).toBe(3.14);
    expect(toNumber(0)).toBe(0);
  });

  it("convierte string numérico a number", () => {
    expect(toNumber("100")).toBe(100);
    expect(toNumber("0.5")).toBe(0.5);
  });

  it("devuelve 0 para null", () => {
    expect(toNumber(null)).toBe(0);
  });

  it("devuelve 0 para undefined", () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it("devuelve NaN para strings no numéricos (comportamiento de Number())", () => {
    expect(Number.isNaN(toNumber("abc"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatARS
// ---------------------------------------------------------------------------
describe("formatARS", () => {
  it("retorna un string", () => {
    expect(typeof formatARS(1000)).toBe("string");
  });

  it("incluye el símbolo de moneda ($)", () => {
    const result = formatARS(1000);
    expect(result).toContain("$");
  });

  it("formatea null como $ 0,00 (el cero)", () => {
    const result = formatARS(null);
    expect(result).toContain("0");
    expect(result).toContain("$");
  });

  it("formatea undefined igual que null", () => {
    const resultNull = formatARS(null);
    const resultUndef = formatARS(undefined);
    expect(resultNull).toBe(resultUndef);
  });

  it("acepta string numérico", () => {
    const resultNum = formatARS(500);
    const resultStr = formatARS("500");
    expect(resultNum).toBe(resultStr);
  });

  it("valores negativos tienen signo negativo", () => {
    const result = formatARS(-200);
    // El signo puede ir antes o después del símbolo según la locale, pero el carácter - debe estar
    expect(result).toContain("-");
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe("formatDateTime", () => {
  it("retorna un string no vacío", () => {
    const result = formatDateTime("2024-06-15T10:30:00");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("incluye el año del ISO", () => {
    const result = formatDateTime("2024-06-15T10:30:00");
    expect(result).toContain("2024");
  });

  it("incluye el día del ISO", () => {
    // El día 15 debe aparecer (en formato dd/mm o similar)
    const result = formatDateTime("2024-06-15T10:30:00");
    expect(result).toContain("15");
  });

  it("incluye la hora del ISO", () => {
    const result = formatDateTime("2024-06-15T10:30:00");
    // "10" o "10:30" debe estar presente
    expect(result).toContain("10");
    expect(result).toContain("30");
  });

  it("formatos distintos dan resultados distintos", () => {
    const r1 = formatDateTime("2024-01-01T00:00:00");
    const r2 = formatDateTime("2025-12-31T23:59:00");
    expect(r1).not.toBe(r2);
  });
});
