import { useState } from "react";
import type { BrandDef, CategoryId, Frequency } from "./types";

type Row = [
  string,
  string,
  string,
  string,
  CategoryId,
  number,
  Frequency,
  string?,
];

const ROWS: Row[] = [
  ["netflix", "Netflix", "#E50914", "N", "streaming", 15.99, "monthly"],
  ["disney", "Disney+", "#113CCF", "+", "streaming", 8.99, "monthly"],
  ["prime", "Amazon Prime", "#00A8E1", "P", "streaming", 4.99, "monthly", "prime video"],
  ["youtube", "YouTube Premium", "#FF0033", "Yt", "streaming", 12.99, "monthly"],
  ["appletv", "Apple TV+", "#A2AAAD", "Tv", "streaming", 9.99, "monthly"],
  ["now", "NOW", "#FFD100", "N", "streaming", 9.99, "monthly"],
  ["paramount", "Paramount+", "#0064FF", "Pa", "streaming", 7.99, "monthly"],
  ["infinity", "Infinity+", "#E10600", "In", "streaming", 7.99, "monthly"],
  ["sky", "Sky", "#E2001A", "Sk", "streaming", 19.99, "monthly"],
  ["dazn", "DAZN", "#0C161C", "D", "sport", 29.99, "monthly"],
  ["mubi", "MUBI", "#0038FF", "Mu", "cultura", 9.99, "monthly"],
  ["spotify", "Spotify", "#1DB954", "S", "musica", 10.99, "monthly"],
  ["applemusic", "Apple Music", "#FC3C44", "Am", "musica", 10.99, "monthly"],
  ["amazonmusic", "Amazon Music", "#25D1DA", "Am", "musica", 8.99, "monthly"],
  ["youtubemusic", "YouTube Music", "#FF0000", "Ym", "musica", 10.99, "monthly"],
  ["deezer", "Deezer", "#A238FF", "Dz", "musica", 10.99, "monthly"],
  ["audible", "Audible", "#F8991C", "Au", "podcast", 9.99, "monthly"],
  ["storytel", "Storytel", "#FF3D00", "St", "podcast", 9.99, "monthly"],
  ["kindle", "Kindle Unlimited", "#FF9900", "K", "editoria", 9.99, "monthly"],
  ["corriere", "Corriere", "#00529B", "Cs", "editoria", 6.99, "monthly"],
  ["repubblica", "Repubblica", "#111111", "Rp", "editoria", 5.99, "monthly"],
  ["icloud", "iCloud+", "#3693F3", "iC", "cloud", 0.99, "monthly"],
  ["googleone", "Google One", "#4285F4", "G", "cloud", 1.99, "monthly"],
  ["dropbox", "Dropbox", "#0061FF", "Db", "cloud", 9.99, "monthly"],
  ["onedrive", "OneDrive", "#0078D4", "Od", "cloud", 1.99, "monthly"],
  ["microsoft", "Microsoft 365", "#D83B01", "M", "ufficio", 7, "monthly"],
  ["gworkspace", "Google Workspace", "#34A853", "Gw", "ufficio", 6.99, "monthly"],
  ["notion", "Notion", "#1A1A1A", "No", "ufficio", 10, "monthly"],
  ["slack", "Slack", "#4A154B", "Sl", "ufficio", 7.25, "monthly"],
  ["zoom", "Zoom", "#2D8CFF", "Z", "ufficio", 13.99, "monthly"],
  ["adobe", "Adobe", "#EB1000", "Ae", "creativita", 9.99, "monthly"],
  ["canva", "Canva", "#00C4CC", "Ca", "creativita", 12.99, "monthly"],
  ["figma", "Figma", "#F24E1E", "Fi", "creativita", 12, "monthly"],
  ["capcut", "CapCut", "#00C2FF", "Cc", "creativita", 7.99, "monthly"],
  ["salesforce", "Salesforce", "#00A1E0", "Sf", "gestionale", 25, "monthly"],
  ["hubspot", "HubSpot", "#FF7A59", "Hs", "gestionale", 20, "monthly"],
  ["nordvpn", "NordVPN", "#4687FF", "Nv", "sicurezza", 4.99, "monthly"],
  ["onepassword", "1Password", "#0572EC", "1P", "sicurezza", 2.99, "monthly"],
  ["bitwarden", "Bitwarden", "#175DDC", "Bw", "sicurezza", 1, "monthly"],
  ["domain", "Dominio .it", "#6366F1", "it", "web", 12.9, "once"],
  ["shopify", "Shopify", "#96BF48", "Sh", "web", 29, "monthly"],
  ["squarespace", "Squarespace", "#000000", "Sq", "web", 16, "monthly"],
  ["openai", "ChatGPT Plus", "#10A37F", "G", "ia", 20, "monthly", "chatgpt gpt"],
  ["claude", "Claude", "#D97757", "Cl", "ia", 20, "monthly"],
  ["gemini", "Gemini", "#4285F4", "Ge", "ia", 19.99, "monthly"],
  ["midjourney", "Midjourney", "#1E1E2E", "Mj", "ia", 10, "monthly"],
  ["perplexity", "Perplexity", "#20808D", "Px", "ia", 20, "monthly"],
  ["playstation", "PlayStation Plus", "#003087", "PS", "gaming", 13.99, "monthly"],
  ["nintendo", "Nintendo Online", "#E60012", "N", "gaming", 3.99, "monthly"],
  ["xbox", "Xbox Game Pass", "#107C10", "X", "gaming", 14.99, "monthly"],
  ["geforce", "GeForce Now", "#76B900", "Gf", "gaming", 10.99, "monthly"],
  ["mcfit", "McFIT", "#E30613", "Mc", "fitness", 19.9, "monthly"],
  ["basicfit", "Basic-Fit", "#E30613", "Bf", "fitness", 24.99, "monthly"],
  ["peloton", "Peloton", "#E11B22", "Pe", "fitness", 12.99, "monthly"],
  ["strava", "Strava", "#FC4C02", "Sv", "fitness", 6.99, "monthly"],
  ["deliveroo", "Deliveroo", "#00CCBC", "De", "food", 3.99, "monthly"],
  ["ubereats", "Uber Eats", "#06C167", "Ue", "food", 5.99, "monthly"],
  ["glovo", "Glovo", "#FFC244", "Gl", "food", 1.99, "monthly"],
  ["justeat", "Just Eat", "#FF8000", "Je", "food", 2.99, "monthly"],
  ["nespresso", "Nespresso", "#8B6914", "Ne", "food", 0, "monthly"],
  ["nen", "Nen", "#E11D48", "Ne", "persona", 9.9, "monthly"],
  ["uberone", "Uber One", "#000000", "U", "mobilita", 5.99, "monthly", "uberone"],
  ["uber", "Uber", "#000000", "U", "mobilita", 0, "monthly"],
  ["telepass", "Telepass", "#0057B8", "Tp", "mobilita", 6.75, "monthly"],
  ["unipol", "UnipolMove", "#00A651", "Um", "mobilita", 1.5, "monthly", "unipol move"],
  ["atm", "ATM Milano", "#E30613", "A", "mobilita", 22, "monthly"],
  ["trenitalia", "Trenitalia", "#E31837", "Ti", "mobilita", 0, "monthly"],
  ["vodafone", "Vodafone", "#E60000", "Vf", "telefono", 9.99, "monthly"],
  ["tim", "TIM", "#E30613", "T", "telefono", 14.99, "monthly"],
  ["fastweb", "Fastweb", "#FF6600", "Fw", "telefono", 29.95, "monthly"],
  ["iliad", "Iliad", "#FF0033", "Il", "telefono", 9.99, "monthly"],
  ["windtre", "WindTre", "#FF6A00", "Wt", "telefono", 8.99, "monthly"],
  ["dimensione", "Dimensione", "#6C2BD9", "Di", "telefono", 6.99, "monthly"],
  ["homobile", "ho.", "#FF6F00", "ho", "telefono", 6.99, "monthly", "ho mobile"],
  ["fineco", "Fineco", "#F7C600", "Fi", "banca", 3.95, "monthly"],
  ["bbva", "BBVA", "#072146", "Bb", "banca", 4.9, "monthly"],
  ["intesa", "Intesa Sanpaolo", "#0066CC", "Is", "banca", 4.5, "monthly", "intesa sanpaolo"],
  ["revolut", "Revolut", "#191C1F", "Rv", "banca", 3.99, "monthly"],
  ["n26", "N26", "#36A18B", "N", "banca", 4.9, "monthly"],
  ["booking", "Booking", "#003580", "Bo", "travel", 0, "yearly"],
  ["airbnb", "Airbnb", "#FF5A5F", "Ab", "travel", 0, "yearly"],
  ["headspace", "Headspace", "#FF7A59", "He", "persona", 12.99, "monthly"],
  ["calm", "Calm", "#2E5EAA", "Ca", "persona", 12.99, "monthly"],
  ["zooplus", "Zooplus", "#78BE20", "Zo", "animali", 0, "monthly"],
  ["verti", "Verti", "#00A3E0", "Ve", "assicurazioni", 19.9, "monthly"],
  ["prima", "Prima", "#FF5A00", "Pr", "assicurazioni", 14.9, "monthly"],
  ["custom", "Personalizzato", "#22D3EE", "?", "altro", 9.99, "monthly"],
];

export const BRANDS: BrandDef[] = ROWS.map((r) => ({
  key: r[0],
  name: r[1],
  color: r[2],
  letter: r[3],
  category: r[4],
  typicalPrice: r[5],
  frequency: r[6],
  aliases: r[7] ? r[7].split(" ") : undefined,
}));

const BRAND_MAP = new Map(BRANDS.map((b) => [b.key, b]));

export function getBrand(key: string): BrandDef {
  return (
    BRAND_MAP.get(key) ?? {
      key,
      name: key,
      color: "#22D3EE",
      letter: key.slice(0, 1).toUpperCase() || "?",
      category: "altro",
      typicalPrice: 9.99,
      frequency: "monthly",
    }
  );
}

export function matchBrands(q: string): BrandDef[] {
  const pool = BRANDS.filter((b) => b.key !== "custom");
  const s = q.trim().toLowerCase();
  if (!s) return pool.slice(0, 14);
  return pool
    .filter((b) => {
      if (b.name.toLowerCase().startsWith(s)) return true;
      if (b.key.toLowerCase().startsWith(s)) return true;
      return (b.aliases ?? []).some((a) => a.toLowerCase().startsWith(s));
    })
    .slice(0, 12);
}

export const BRAND_ICON: Record<string, "svg" | "png"> = {
  adobe: "svg",
  airbnb: "svg",
  amazonmusic: "svg",
  applemusic: "svg",
  appletv: "svg",
  atm: "png",
  audible: "svg",
  basicfit: "png",
  bitwarden: "svg",
  booking: "png",
  calm: "png",
  canva: "svg",
  capcut: "png",
  claude: "svg",
  corriere: "png",
  dazn: "svg",
  deezer: "svg",
  deliveroo: "svg",
  disney: "svg",
  domain: "png",
  dropbox: "svg",
  figma: "svg",
  geforce: "svg",
  gemini: "svg",
  glovo: "svg",
  googleone: "svg",
  gworkspace: "svg",
  headspace: "svg",
  hubspot: "svg",
  icloud: "svg",
  infinity: "png",
  justeat: "svg",
  kindle: "svg",
  mcfit: "png",
  microsoft: "svg",
  midjourney: "png",
  mubi: "svg",
  nespresso: "png",
  netflix: "svg",
  nintendo: "svg",
  nordvpn: "svg",
  notion: "svg",
  now: "svg",
  onedrive: "svg",
  onepassword: "svg",
  openai: "svg",
  paramount: "svg",
  peloton: "svg",
  perplexity: "svg",
  playstation: "svg",
  prima: "png",
  prime: "svg",
  repubblica: "png",
  salesforce: "svg",
  shopify: "svg",
  sky: "svg",
  slack: "svg",
  spotify: "svg",
  squarespace: "svg",
  storytel: "png",
  strava: "svg",
  trenitalia: "png",
  ubereats: "svg",
  uberone: "svg",
  verti: "png",
  xbox: "svg",
  youtube: "svg",
  youtubemusic: "svg",
  zoom: "svg",
  zooplus: "png",
  uber: "svg",
  telepass: "svg",
  unipol: "svg",
  vodafone: "svg",
  tim: "svg",
  fastweb: "svg",
  iliad: "svg",
  windtre: "svg",
  dimensione: "svg",
  homobile: "svg",
  fineco: "svg",
  bbva: "svg",
  intesa: "svg",
  revolut: "svg",
  n26: "svg",
};

export function brandIconUrl(key: string): string | null {
  const ext = BRAND_ICON[key];
  // Percorso relativo alla pagina corrente: funziona sia su un dominio
  // proprio sia su https://utente.github.io/nome-repo/ senza modifiche.
  return ext ? `${import.meta.env.BASE_URL}brands/${key}.${ext}` : null;
}

const IMG = new Map<string, HTMLImageElement>();

export function getBrandImage(key: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const hit = IMG.get(key);
  if (hit) return hit;
  const url = brandIconUrl(key);
  if (!url) return null;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  IMG.set(key, img);
  return img;
}

export function preloadBrandIcons() {
  Object.keys(BRAND_ICON).forEach((k) => getBrandImage(k));
}

export function drawBrand(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  r: number,
) {
  const brand = getBrand(key);
  const img = getBrandImage(key);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = brand.color;
  ctx.fill();
  ctx.clip();
  const ready = img && img.complete && img.naturalWidth > 0;
  if (ready) {
    const s = r * 1.22;
    ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
  } else {
    const letter = brand.letter.length > 2 ? brand.letter.slice(0, 2) : brand.letter;
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${letter.length > 1 ? r * 0.7 : r}px Outfit, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, x, y + r * 0.04);
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = Math.max(0.6, r * 0.045);
  ctx.stroke();
  ctx.restore();
}

export function BrandBadge({
  brandKey,
  size = 44,
  letter,
  glass,
}: {
  brandKey: string;
  size?: number;
  letter?: string;
  square?: boolean;
  glass?: boolean;
}) {
  const brand = getBrand(brandKey);
  const display = letter ?? brand.letter;
  const [broken, setBroken] = useState(false);
  const src = !broken ? brandIconUrl(brandKey) : null;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: glass
          ? `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.35), ${brand.color} 62%)`
          : brand.color,
        fontSize: display.length > 1 ? size * 0.32 : size * 0.42,
        boxShadow: glass
          ? `0 8px 22px rgba(0,0,0,0.38), 0 0 18px ${brand.color}44`
          : `0 0 16px ${brand.color}33`,
      }}
      aria-hidden
    >
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          style={{
            width: size * 0.56,
            height: size * 0.56,
          }}
        />
      ) : (
        <span className="leading-none">{display}</span>
      )}
    </span>
  );
}

