export function severityForServiceRequest({ type, urgent }) {
  if (urgent) return "urgent";

  const t = String(type || "").toUpperCase();
  if (t === "BILL") return "urgent";
  if (t === "HELP") return "urgent";

  return "normal";
}
export function severityForTicket({ lines }) {
  const count = Array.isArray(lines) ? lines.length : 0;

  // You can tweak this threshold later
  if (count >= 7) return "urgent";

  return "normal";
}