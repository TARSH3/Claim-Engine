const CURRENCY = "USD"; // change in one place
export const money = (v: string | number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(Number(v ?? 0));
export const day = (v: string | Date) => new Date(v).toISOString().slice(0, 10);
