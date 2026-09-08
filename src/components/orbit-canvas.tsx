import { useEffect, useRef } from "react";
import { activeMonthlyTotal, classify, daysUntilRenewal, monthlyEquivalent, orbitUrgency } from "@/lib/domain";
import { formatEuroCompact } from "@/lib/format";
import { drawBrand, getBrand, preloadBrandIcons } from "@/lib/logos";
import type { StatusFilter, Subscription } from "@/lib/types";
