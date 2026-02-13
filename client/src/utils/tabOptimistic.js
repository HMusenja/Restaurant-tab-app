function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Optimistically add item to a tab (cart)
 * Matches your MenuItem + Tab schema exactly
 */
export function optimisticAddToTab(prevTab, { menuItem, qty = 1 }) {
  if (!prevTab || !menuItem) return prevTab;

  const q = clamp(Number(qty || 1), 1, 99);

  const next = {
    ...prevTab,
    items: Array.isArray(prevTab.items)
      ? prevTab.items.map((i) => ({ ...i }))
      : [],
  };

  const idStr = String(menuItem._id);

  const idx = next.items.findIndex(
    (it) => String(it.menuItemId) === idStr
  );

  if (idx >= 0) {
    next.items[idx].qty = clamp(next.items[idx].qty + q, 1, 99);
  } else {
    next.items.push({
      menuItemId: idStr,
      nameSnap: menuItem.name,
      categorySnap: menuItem.category || "",
      priceCentsSnap: menuItem.priceCents ?? 0,
      qty: q,
      addedAt: new Date().toISOString(),
    });
  }

  /* ---------- totals (client mirror of server logic) ---------- */

  const cartSubtotalCents = next.items.reduce(
    (sum, it) =>
      sum +
      (Number(it.priceCentsSnap) || 0) *
        (Number(it.qty) || 0),
    0
  );

  const billSubtotalCents = Number(next.billSubtotalCents || 0);

  const tip = next.tip || { type: "PERCENT", value: 0 };
  let tipCents = 0;

  if (tip.type === "PERCENT") {
    const pct = clamp(Number(tip.value || 0), 0, 50);
    tipCents = Math.round(
      ((billSubtotalCents + cartSubtotalCents) * pct) / 100
    );
  } else {
    tipCents = clamp(Number(tip.value || 0), 0, 10000);
  }

  next.subtotalCents = billSubtotalCents + cartSubtotalCents;
  next.totalCents = next.subtotalCents + tipCents;
  next.amountDueCents = Math.max(
    0,
    next.totalCents - Number(next.amountPaidCents || 0)
  );

  next.version = (next.version || 0) + 1;

  return next;
}
