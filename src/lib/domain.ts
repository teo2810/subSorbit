import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import type {
  BodyKind,
  CategoryId,
  Frequency,
  Status,
  Subscription,
} from "./types";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "streaming", label: "Streaming video" },
  { id: "musica", label: "Streaming musicale" },
  { id: "podcast", label: "Audiolibri e podcast" },
  { id: "editoria", label: "Editoria" },
  { id: "cloud", label: "Cloud" },
  { id: "ufficio", label: "Suite ufficio" },
  { id: "creativita", label: "Creatività" },
  { id: "gestionale", label: "Gestionale" },
  { id: "sicurezza", label: "Sicurezza" },
  { id: "web", label: "Web" },
  { id: "ia", label: "IA" },
  { id: "gaming", label: "Cloud gaming" },
  { id: "sport", label: "Eventi sportivi" },
  { id: "fitness", label: "Fitness" },
  { id: "cultura", label: "Cultura" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "food", label: "Food delivery" },
  { id: "mobilita", label: "Mobilità" },
  { id: "travel", label: "Travel" },
  { id: "persona", label: "Cura persona" },
  { id: "animali", label: "Cura animali" },
  { id: "assicurazioni", label: "Assicurazioni" },
  { id: "telefono", label: "Telefonia" },
  { id: "banca", label: "Banca" },
  { id: "altro", label: "Altro" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  streaming: "#FF2B4A",
  musica: "#39FF6A",
  podcast: "#FF8A00",
  editoria: "#FFE14D",
  cloud: "#3DF0FF",
  ufficio: "#FF5C33",
  creativita: "#FF6EC7",
  gestionale: "#00E5FF",
  sicurezza: "#7B8CFF",
  web: "#B388FF",
  ia: "#00FFC2",
  gaming: "#7CFF3F",
  sport: "#FFF200",
  fitness: "#D57BFF",
  cultura: "#8AB4FF",
  ecommerce: "#FFB020",
  food: "#00FFD0",
  mobilita: "#2DFF8A",
  travel: "#4DA3FF",
  persona: "#FF4D9A",
  animali: "#FFD166",
  assicurazioni: "#66E0FF",
  telefono: "#FF3B30",
  banca: "#FFE600",
  produttivita: "#FF6A3D",
  altro: "#C8D0DC",
};

export const FREQUENCIES: { id: Frequency; label: string; short: string }[] = [
  { id: "weekly", label: "Settimanale", short: "sett." },
  { id: "monthly", label: "Mensile", short: "mese" },
  { id: "yearly", label: "Annuale", short: "anno" },
  { id: "once", label: "Una tantum", short: "una t." },
];

export const STATUSES: { id: Status; label: string }[] = [
  { id: "active", label: "Attivo" },
  { id: "paused", label: "In pausa" },
  { id: "cancelled", label: "Annullato" },
];

export function categoryLabel(id: CategoryId | string): string {
  if (id === "produttivita") return "Suite ufficio";
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryColor(id: string): string {
  return CATEGORY_COLORS[id] ?? "#64748B";
}

export function frequencyLabel(id: Frequency): string {
  return FREQUENCIES.find((f) => f.id === id)?.label ?? id;
}

export function frequencyShort(id: Frequency): string {
  return FREQUENCIES.find((f) => f.id === id)?.short ?? id;
}

export function statusLabel(id: Status): string {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function monthlyEquivalent(s: Subscription): number {
  const price = Number(s.price);
  if (!Number.isFinite(price)) return 0;
  switch (s.frequency) {
    case "monthly":
      return price;
    case "yearly":
      return price / 12;
    case "weekly":
      return (price * 52) / 12;
    case "once":
      return price / 12;
    default:
      return price;
  }
}

export function monthlyCost(s: Subscription): number {
  if (s.status !== "active") return 0;
  return monthlyEquivalent(s);
}

export function activeMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((sum, s) => sum + monthlyCost(s), 0);
}

export function yearlyProjection(subs: Subscription[]): number {
  return activeMonthlyTotal(subs) * 12;
}

export type SpendPeriod = "month" | "year";

export interface PeriodSpend {
  period: SpendPeriod;
  start: Date;
  end: Date;
  due: number;
  paid: number;
  remaining: number;
  percent: number;
  count: number;
}

export function periodBounds(period: SpendPeriod, from: Date = new Date()) {
  if (period === "year") {
    return { start: startOfYear(from), end: endOfYear(from) };
  }
  return { start: startOfMonth(from), end: endOfMonth(from) };
}

export function computePeriodSpend(
  subs: Subscription[],
  period: SpendPeriod,
  from: Date = new Date(),
): PeriodSpend {
  const { start, end } = periodBounds(period, from);
  const today = startOfDay(from);
  let due = 0;
  let paid = 0;
  let count = 0;
  for (const s of subs) {
    if (s.status !== "active") continue;
    const share = period === "year" ? monthlyCost(s) * 12 : monthlyCost(s);
    if (share <= 0) continue;
    due += share;
    count += 1;
    const billed = occurrencesInRange(s, start, end).some(
      (d) => !isAfter(startOfDay(d), today),
    );
    if (billed) paid += share;
  }
  return {
    period,
    start,
    end,
    due,
    paid,
    remaining: Math.max(0, due - paid),
    percent: due > 0 ? paid / due : 0,
    count,
  };
}

export function activePriceStats(subs: Subscription[]) {
  const active = subs.filter((s) => s.status === "active");
  const prices = active.map((s) => monthlyEquivalent(s));
  const highest = prices.length ? Math.max(...prices) : 0;
  const lowest = prices.length ? Math.min(...prices) : 0;
  const mid =
    prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  return {
    count: active.length,
    highest,
    lowest,
    mid,
  };
}

export function spendByCategory(
  subs: Subscription[],
  period: SpendPeriod = "month",
) {
  const map = new Map<string, number>();
  const mul = period === "year" ? 12 : 1;
  for (const s of subs) {
    if (s.status !== "active") continue;
    const id = s.category === "produttivita" ? "ufficio" : s.category;
    map.set(id, (map.get(id) ?? 0) + monthlyCost(s) * mul);
  }
  return [...map.entries()]
    .map(([id, value]) => ({
      id,
      label: categoryLabel(id),
      value,
      color: categoryColor(id),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startedOf(s: Subscription): string {
  return s.startedAt || s.nextRenewal;
}

export function nextFromStart(
  startedAt: string,
  freq: Frequency,
  from: Date = new Date(),
): string {
  return isoDate(nextOccurrence(startedAt, freq, from));
}

export function classify(s: Subscription, activeTotal: number): BodyKind {
  if (s.status === "cancelled") return "trash";
  if (s.status === "paused") return "cancelled";
  if (s.frequency === "once") return "comet";
  const equiv = monthlyEquivalent(s);
  if (activeTotal > 0 && equiv / activeTotal < 0.05) return "asteroid";
  return "planet";
}

export function bodyKindLabel(kind: BodyKind): string {
  switch (kind) {
    case "planet":
      return "Pianeta";
    case "comet":
      return "Cometa";
    case "asteroid":
      return "Asteroide";
    case "trash":
      return "Orbita spazzatura";
    case "cancelled":
      return "Nube (in pausa)";
  }
}

function stepForward(d: Date, freq: Frequency): Date {
  if (freq === "weekly") return addWeeks(d, 1);
  if (freq === "yearly") return addYears(d, 1);
  if (freq === "once") return d;
  return addMonths(d, 1);
}

function stepBack(d: Date, freq: Frequency): Date {
  if (freq === "weekly") return subWeeks(d, 1);
  if (freq === "yearly") return subYears(d, 1);
  if (freq === "once") return d;
  return subMonths(d, 1);
}

export function nextOccurrence(
  dateStr: string,
  freq: Frequency,
  from: Date = new Date(),
): Date {
  let d = parseISO(dateStr);
  if (Number.isNaN(d.getTime())) d = startOfDay(from);
  if (freq === "once") return d;
  const origin = startOfDay(from);
  let guard = 0;
  while (isBefore(d, origin) && guard < 240) {
    d = stepForward(d, freq);
    guard += 1;
  }
  return d;
}

export function daysUntilRenewal(s: Subscription, from: Date = new Date()): number {
  const next = nextOccurrence(s.nextRenewal, s.frequency, from);
  const days = differenceInCalendarDays(next, startOfDay(from));
  if (s.frequency === "once" && days < 0) return 9999;
  return Math.max(0, days);
}

export function frequencyBand(freq: Frequency): number {
  switch (freq) {
    case "weekly":
      return 0;
    case "monthly":
      return 1;
    case "yearly":
      return 2;
    case "once":
      return 3;
  }
}

export function orbitUrgency(s: Subscription, from: Date = new Date()): number {
  if (s.status !== "active") return 0;
  const days = daysUntilRenewal(s, from);
  if (days >= 9000) return 0;
  const span =
    s.frequency === "weekly"
      ? 7
      : s.frequency === "monthly"
        ? 31
        : s.frequency === "yearly"
          ? 365
          : 90;
  return 1 - Math.min(1, days / span);
}

export function occurrencesInRange(
  sub: Subscription,
  start: Date,
  end: Date,
): Date[] {
  const out: Date[] = [];
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  const raw = parseISO(sub.nextRenewal);
  if (Number.isNaN(raw.getTime())) return out;
  if (sub.frequency === "once") {
    const d = startOfDay(raw);
    if (d >= startDay && d <= endDay) out.push(d);
    return out;
  }
  let d = startOfDay(raw);
  let guard = 0;
  while (d > startDay && guard < 240) {
    const prev = stepBack(d, sub.frequency);
    if (prev.getTime() === d.getTime()) break;
    d = startOfDay(prev);
    guard += 1;
  }
  guard = 0;
  while (d < startDay && guard < 240) {
    d = startOfDay(stepForward(d, sub.frequency));
    guard += 1;
  }
  guard = 0;
  while (d <= endDay && guard < 240) {
    out.push(d);
    d = startOfDay(stepForward(d, sub.frequency));
    guard += 1;
  }
  return out;
}

export function occursOnDay(sub: Subscription, day: Date): boolean {
  if (sub.status === "cancelled") return false;
  const start = startOfDay(day);
  return occurrencesInRange(sub, start, start).some((d) => isSameDay(d, start));
}

export function statusColorVar(status: Status): string {
  if (status === "active") return "var(--color-ok)";
  if (status === "paused") return "var(--color-warn)";
  return "var(--color-bad)";
}

const FREQS: Frequency[] = ["weekly", "monthly", "yearly", "once"];
const STATS: Status[] = ["active", "paused", "cancelled"];

export function normalizeSubscription(raw: unknown, i = 0): Subscription | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const price = Number(r.price);
  if (!Number.isFinite(price)) return null;
  const dateRaw = String(r.nextRenewal ?? r.startedAt ?? "");
  const parsed = Date.parse(dateRaw);
  const next =
    Number.isFinite(parsed) ? isoDate(new Date(parsed)) : isoDate(new Date());
  const freq = FREQS.includes(r.frequency as Frequency)
    ? (r.frequency as Frequency)
    : "monthly";
  const status = STATS.includes(r.status as Status) ? (r.status as Status) : "active";
  const cat = String(r.category || "altro") as CategoryId;
  return {
    id: String(r.id || `imp-${Date.now()}-${i}`),
    name: String(r.name || "Abbonamento").slice(0, 80),
    category: CATEGORIES.some((c) => c.id === cat) || cat === "produttivita" ? cat : "altro",
    price,
    frequency: freq,
    nextRenewal: next,
    startedAt: typeof r.startedAt === "string" ? r.startedAt : next,
    status,
    brandKey: String(r.brandKey || r.name || "custom"),
    notes: String(r.notes ?? ""),
  };
}

export function parseBackupPayload(data: unknown): {
  subscriptions: Subscription[];
  displayName?: string;
  email?: string;
} {
  const root = data as Record<string, unknown> | unknown[];
  const list = Array.isArray(root)
    ? root
    : Array.isArray((root as Record<string, unknown>)?.subscriptions)
      ? ((root as Record<string, unknown>).subscriptions as unknown[])
      : null;
  if (!list) throw new Error("formato");
  const subscriptions = list
    .map((item, i) => normalizeSubscription(item, i))
    .filter((s): s is Subscription => Boolean(s));
  if (!subscriptions.length) throw new Error("vuoto");
  const obj = Array.isArray(root) ? {} : (root as Record<string, unknown>);
  return {
    subscriptions,
    displayName: typeof obj.displayName === "string" ? obj.displayName : undefined,
    email: typeof obj.email === "string" ? obj.email : undefined,
  };
}

export function emptySubscription(): Omit<Subscription, "id"> {
  const today = isoDate(new Date());
  return {
    name: "",
    category: "altro",
    price: 9.99,
    frequency: "monthly",
    nextRenewal: today,
    startedAt: today,
    status: "active",
    brandKey: "custom",
    notes: "",
  };
}
