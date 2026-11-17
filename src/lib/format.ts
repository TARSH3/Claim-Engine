const CURRENCY = "INR";
export const money = (v: string | number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(v ?? 0));

export const day = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
};
