import { format, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function formatEuroCompact(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const str = rounded.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `€${str}`;
}

export function formatDay(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  if (isToday(d)) return "Oggi";
  if (isTomorrow(d)) return "Domani";
  return format(d, "d MMM", { locale: it });
}

export function formatDayLong(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMMM yyyy", { locale: it });
}

export function formatMonthTitle(d: Date): string {
  return format(d, "LLLL yyyy", { locale: it });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
}
