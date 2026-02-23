// src/lib/tableDetailUtils.js

export const statusColors = {
  available: "bg-success/20 text-success",
  occupied: "bg-primary/20 text-primary",
  reserved: "bg-warning/20 text-warning",
};

export function formatEUR(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

export function getSessionDuration(date) {
  if (!date) return "—";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function timeAgoFromISO(iso) {
  if (!iso) return "—";
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1m ago";
  return `${minutes}m ago`;
}

export function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toUiStatus({ backendStatus, reservationStatus }) {
  // backendStatus: FREE | OCCUPIED | RESERVED
  // reservationStatus: BOOKED | SEATED | null
  if (backendStatus === "OCCUPIED" || reservationStatus === "SEATED") return "occupied";
  // "Reserved" means reserved for TODAY only
  if (reservationStatus === "BOOKED") return "reserved";
  return "available";
}

export function normalizeTable(payload, reservation) {
  const t = payload?.table ?? payload;

  const activeTabObj =
    t?.activeTab && typeof t.activeTab === "object" ? t.activeTab : null;

  const backendStatus = t.status;
  const reservationStatus = reservation?.status ?? null;

  return {
    id: String(t.id || t._id),
    number: t.number,
    name: `Table ${String(t.number).padStart(2, "0")}`,
    status: toUiStatus({ backendStatus, reservationStatus }),
    backendStatus,
    assignedAt: t.assignedAt ? new Date(t.assignedAt) : null,
    guestCount: typeof t.guestCount === "number" ? t.guestCount : undefined,
    joinCode: t.joinCode ?? null,
    joinCodeExpiresAt: t.joinCodeExpiresAt ? new Date(t.joinCodeExpiresAt) : null,
    joinUrl: t.joinUrl ?? null,
    activeTabId: activeTabObj?.id || activeTabObj?._id || null,
    tabTotalCents: activeTabObj?.totalCents ?? 0,
    maxCapacity: t.maxCapacity ?? 6,
  };
}

export function pickActiveReservationForTable(reservations, tableId) {
  const now = new Date();

  const active = (reservations || []).filter((r) => {
    const status = String(r.status || "").toUpperCase();
    if (status !== "BOOKED" && status !== "SEATED") return false;

    const rid = String(r?.table?._id || r?.table?.id || r?.table || "");
    return rid === String(tableId);
  });

  active.sort((a, b) => {
    const aSeated = a.status === "SEATED";
    const bSeated = b.status === "SEATED";
    if (aSeated !== bSeated) return aSeated ? -1 : 1;

    const aT = new Date(a.reservedFor).getTime();
    const bT = new Date(b.reservedFor).getTime();
    const aUpcoming = aT >= now.getTime();
    const bUpcoming = bT >= now.getTime();
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

    return aT - bT;
  });

  return active[0] || null;
}

export function toLocalTimeHHMM(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function toLocalDateYYYYMMDD(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildISOFromLocalDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  const dt = new Date();
  dt.setFullYear(y, (m || 1) - 1, d || 1);
  dt.setHours(hh || 0, mm || 0, 0, 0);

  return dt.toISOString();
}
