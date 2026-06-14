import { useWsStore } from "../store/wsStore";

/**
 * Badge de estado de la conexión WebSocket en tiempo real (doc §9.6).
 * Lee el `wsStore`. No hace polling: refleja el estado que reportan los hooks WS.
 */
export default function WsStatusBadge() {
  const status = useWsStore((s) => s.status);

  const cfg = {
    connected: {
      dot: "bg-success-500",
      text: "En tiempo real",
      cls: "bg-success-50 text-success-700 border-success-200",
      pulse: true,
    },
    connecting: {
      dot: "bg-warning-500",
      text: "Conectando…",
      cls: "bg-warning-50 text-warning-700 border-warning-200",
      pulse: true,
    },
    disconnected: {
      dot: "bg-danger-500",
      text: "Sin conexión en tiempo real",
      cls: "bg-danger-50 text-danger-700 border-danger-200",
      pulse: false,
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.cls}`}
      title={`WebSocket: ${status}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.text}
    </span>
  );
}
