export function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v);
}

export function formatARS(v: number | string | null | undefined): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(toNumber(v));
}

function parseUtc(iso: string): Date {
  // El backend serializa sin 'Z' — forzamos UTC agregándola si falta
  return new Date(iso.endsWith("Z") ? iso : iso + "Z");
}

export function formatDateTime(iso: string): string {
  return parseUtc(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}