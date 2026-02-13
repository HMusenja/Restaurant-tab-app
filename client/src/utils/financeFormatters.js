// src/pages/admin/finance/utils/financeFormatters.js

export function formatEUR(cents = 0) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(cents) / 100);
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatRangeLabel({ scope, from, to, year, month }) {
  if (scope === "today") return "Today";
  if (scope === "year") return String(year);

  if (scope === "month") {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  }

  if (from && to) {
    const f = new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
    }).format(new Date(from));

    const t = new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(to));

    return `${f} – ${t}`;
  }

  return "—";
}
