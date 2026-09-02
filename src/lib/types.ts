export type Frequency = "weekly" | "monthly" | "yearly" | "once";
export type Status = "active" | "paused" | "cancelled";
export type BodyKind = "planet" | "comet" | "asteroid" | "trash" | "cancelled";
export type CategoryId =
  | "streaming"
  | "musica"
  | "podcast"
  | "editoria"
  | "cloud"
  | "ufficio"
  | "creativita"
  | "gestionale"
  | "sicurezza"
  | "web"
  | "ia"
  | "gaming"
  | "sport"
  | "fitness"
  | "cultura"
  | "ecommerce"
  | "food"
  | "mobilita"
  | "travel"
  | "persona"
  | "animali"
  | "assicurazioni"
  | "telefono"
  | "telefono_mobile"
  | "telefono_fissa"
  | "banca"
  | "produttivita"
  | "altro";
export type TabId = "home" | "orbit" | "calendar" | "data";
export type StatusFilter = "all" | Status;

export interface Subscription {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  frequency: Frequency;
  nextRenewal: string;
  startedAt?: string;
  status: Status;
  brandKey: string;
  notes: string;
}

export interface BrandDef {
  key: string;
  name: string;
  color: string;
  letter: string;
  category: CategoryId;
  typicalPrice: number;
  frequency: Frequency;
  aliases?: string[];
}
