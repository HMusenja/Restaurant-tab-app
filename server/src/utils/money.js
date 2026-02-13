export function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.min(Math.max(x, min), max);
}

export function calcTabTotals({ items = [], tip, amountPaidCents, billSubtotalCents = 0 }) {
  const cartSubtotalCents = items.reduce(
    (sum, it) => sum + it.priceCentsSnap * it.qty,
    0
  );

  const fullSubtotalCents = cartSubtotalCents + (billSubtotalCents || 0);

  let tipCents = 0;

  if (tip?.type === "PERCENT") {
    const pct = Math.max(0, Number(tip.value || 0));
    tipCents = Math.round((fullSubtotalCents * pct) / 100);
  } else if (tip?.type === "AMOUNT") {
    tipCents = Math.max(0, Math.trunc(Number(tip.value || 0)));
  }

  const totalCents = fullSubtotalCents + tipCents;
  const paid = Math.max(0, Math.trunc(Number(amountPaidCents || 0)));
  const amountDueCents = Math.max(0, totalCents - paid);

  return { subtotalCents: fullSubtotalCents, totalCents, amountDueCents };
}
