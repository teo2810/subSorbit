import { useMemo, useState } from "react";
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

type IconMeta = { slug?: string; domain: string };

const ICON_META: Record<string, IconMeta> = {
  netflix: { slug: "netflix", domain: "netflix.com" },
  disney: { slug: "disneyplus", domain: "disneyplus.com" },
  prime: { slug: "primevideo", domain: "primevideo.com" },
  youtube: { slug: "youtube", domain: "youtube.com" },
  appletv: { slug: "appletv", domain: "tv.apple.com" },
  now: { slug: "now", domain: "nowtv.com" },
  paramount: { slug: "paramountplus", domain: "paramountplus.com" },
  infinity: { domain: "infinitytv.it" },
  sky: { slug: "sky", domain: "sky.it" },
  dazn: { slug: "dazn", domain: "dazn.com" },
  mubi: { slug: "mubi", domain: "mubi.com" },
  spotify: { slug: "spotify", domain: "spotify.com" },
  applemusic: { slug: "applemusic", domain: "music.apple.com" },
  amazonmusic: { slug: "amazonmusic", domain: "music.amazon.it" },
  youtubemusic: { slug: "youtubemusic", domain: "music.youtube.com" },
  deezer: { slug: "deezer", domain: "deezer.com" },
  audible: { slug: "audible", domain: "audible.it" },
  storytel: { slug: "storytel", domain: "storytel.com" },
  kindle: { slug: "amazon", domain: "amazon.it" },
  corriere: { domain: "corriere.it" },
  repubblica: { domain: "repubblica.it" },
  icloud: { slug: "icloud", domain: "icloud.com" },
  googleone: { slug: "google", domain: "one.google.com" },
  dropbox: { slug: "dropbox", domain: "dropbox.com" },
  onedrive: { slug: "microsoftonedrive", domain: "onedrive.live.com" },
  microsoft: { slug: "microsoft365", domain: "microsoft.com" },
  gworkspace: { slug: "google", domain: "workspace.google.com" },
  notion: { slug: "notion", domain: "notion.so" },
  slack: { slug: "slack", domain: "slack.com" },
  zoom: { slug: "zoom", domain: "zoom.us" },
  adobe: { slug: "adobe", domain: "adobe.com" },
  canva: { slug: "canva", domain: "canva.com" },
  figma: { slug: "figma", domain: "figma.com" },
  capcut: { slug: "capcut", domain: "capcut.com" },
  salesforce: { slug: "salesforce", domain: "salesforce.com" },
  hubspot: { slug: "hubspot", domain: "hubspot.com" },
  nordvpn: { slug: "nordvpn", domain: "nordvpn.com" },
  onepassword: { slug: "1password", domain: "1password.com" },
  bitwarden: { slug: "bitwarden", domain: "bitwarden.com" },
  domain: { domain: "nic.it" },
  shopify: { slug: "shopify", domain: "shopify.com" },
  squarespace: { slug: "squarespace", domain: "squarespace.com" },
  openai: { slug: "openai", domain: "openai.com" },
  claude: { slug: "anthropic", domain: "claude.ai" },
  gemini: { slug: "googlegemini", domain: "gemini.google.com" },
  midjourney: { slug: "midjourney", domain: "midjourney.com" },
  perplexity: { slug: "perplexity", domain: "perplexity.ai" },
  playstation: { slug: "playstation", domain: "playstation.com" },
  nintendo: { slug: "nintendo", domain: "nintendo.com" },
  xbox: { slug: "xbox", domain: "xbox.com" },
  geforce: { slug: "nvidia", domain: "nvidia.com" },
  mcfit: { domain: "mcfit.com" },
  basicfit: { domain: "basic-fit.com" },
  peloton: { slug: "peloton", domain: "onepeloton.com" },
  strava: { slug: "strava", domain: "strava.com" },
  deliveroo: { slug: "deliveroo", domain: "deliveroo.it" },
  ubereats: { slug: "ubereats", domain: "ubereats.com" },
  glovo: { slug: "glovo", domain: "glovoapp.com" },
  justeat: { slug: "justeat", domain: "justeat.it" },
  nespresso: { slug: "nespresso", domain: "nespresso.com" },
  nen: { domain: "nen.it" },
  uberone: { slug: "uber", domain: "uber.com" },
  uber: { slug: "uber", domain: "uber.com" },
  telepass: { domain: "telepass.com" },
  unipol: { domain: "unipolmove.it" },
  atm: { domain: "atm.it" },
  trenitalia: { domain: "trenitalia.com" },
  vodafone: { slug: "vodafone", domain: "vodafone.it" },
  tim: { domain: "tim.it" },
  fastweb: { domain: "fastweb.it" },
  iliad: { slug: "iliad", domain: "iliad.it" },
  windtre: { domain: "windtre.it" },
  dimensione: { domain: "dimensionemobile.it" },
  homobile: { domain: "ho-mobile.it" },
  fineco: { domain: "finecobank.com" },
  bbva: { slug: "bbva", domain: "bbva.it" },
  intesa: { domain: "intesasanpaolo.com" },
  revolut: { slug: "revolut", domain: "revolut.com" },
  n26: { slug: "n26", domain: "n26.com" },
  booking: { slug: "bookingdotcom", domain: "booking.com" },
  airbnb: { slug: "airbnb", domain: "airbnb.com" },
  headspace: { slug: "headspace", domain: "headspace.com" },
  calm: { slug: "calm", domain: "calm.com" },
  zooplus: { domain: "zooplus.it" },
  verti: { domain: "verti.it" },
  prima: { domain: "prima.it" },
};

function guessDomain(name: string): string | null {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/\+.*$/, "")
    .replace(/[^a-z0-9 .]/g, "")
    .trim();
  if (!cleaned) return null;
  const firstWord = cleaned.split(/\s+/)[0];
  if (!firstWord || firstWord.length < 2) return null;
  return `${firstWord}.com`;
}

export function remoteIconCandidates(key: string, name?: string): string[] {
  const meta = ICON_META[key];
  const domain = meta?.domain ?? guessDomain(name ?? key);
  const urls: string[] = [];
  if (domain) {
    urls.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
    urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }
  if (meta?.slug) {
    urls.push(`https://cdn.simpleicons.org/${meta.slug}/ffffff`);
  }
  return urls;
}

export function brandIconUrl(key: string): string | null {
  return remoteIconCandidates(key)[0] ?? null;
}

const IMG = new Map<string, HTMLImageElement>();

export function getBrandImage(key: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const hit = IMG.get(key);
  if (hit) return hit;
  const url = remoteIconCandidates(key)[0];
  if (!url) return null;
  const img = new Image();
  img.decoding = "async";
  if (url.includes("simpleicons.org")) img.crossOrigin = "anonymous";
  img.src = url;
  IMG.set(key, img);
  return img;
}

export function preloadBrandIcons() {
  Object.keys(ICON_META).forEach((k) => getBrandImage(k));
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
    const s = r * 2;
    ctx.drawImage(img, x - r, y - r, s, s);
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
  name,
}: {
  brandKey: string;
  size?: number;
  letter?: string;
  square?: boolean;
  glass?: boolean;
  /** Nome digitato dall'utente: usato solo per il fallback via API quando
   * il brand non è tra quelli censiti localmente. */
  name?: string;
}) {
  const brand = getBrand(brandKey);
  const display = letter ?? brand.letter;
  const candidates = useMemo(
    () => remoteIconCandidates(brandKey, name ?? brand.name),
    [brandKey, name, brand.name],
  );
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  const isGlyph = Boolean(src?.includes("simpleicons.org"));

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
          key={src}
          src={src}
          alt=""
          onError={() => setIdx((i) => i + 1)}
          style={
            isGlyph
              ? { width: size * 0.56, height: size * 0.56 }
              : { width: size, height: size, objectFit: "cover" }
          }
        />
      ) : (
        <span className="leading-none">{display}</span>
      )}
    </span>
  );
}

export function BrandWatermark({
  brandKey,
  name,
  className,
}: {
  brandKey: string;
  name?: string;
  className?: string;
}) {
  const brand = getBrand(brandKey);
  const candidates = useMemo(
    () => remoteIconCandidates(brandKey, name ?? brand.name),
    [brandKey, name, brand.name],
  );
  const [idx, setIdx] = useState(0);
  const src = candidates[idx];
  return (
    <span
      className={className}
      aria-hidden
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt=""
          onError={() => setIdx((i) => i + 1)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "blur(1.2px)",
            opacity: 0.22,
          }}
        />
      ) : (
        <span
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 700,
            color: "#fff",
            opacity: 0.12,
            filter: "blur(2px)",
          }}
        >
          {brand.letter}
        </span>
      )}
    </span>
  );
}

