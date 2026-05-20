/**
 * BENOT – File-based JSON data store
 *
 * Persistence layer using atomic file writes.
 * Swap this file for a SQLite/Postgres adapter whenever the load justifies it.
 * All public functions are synchronous; upgrade to async if switching backends.
 */
import fs   from "fs";
import path from "path";
import { randomUUID } from "crypto";

import type {
  Order,
  Provider,
  Payout,
  PendingCart,
  ProductType,
  ProductionStatus,
} from "./types";

/* ── Data directory (mounted as Docker volume /app/data) ─────────── */
// Exported so other modules (snapshot, pdf) can derive sub-paths.
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/* ── Atomic JSON read / write ────────────────────────────────────── */
function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(file: string, data: T): void {
  ensureDir();
  const p   = path.join(DATA_DIR, file);
  const tmp = p + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, p);   // atomic on POSIX
}

/* ══════════════════════════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════════════════════════ */
const ORDERS_FILE = "orders.json";

export const ordersRepo = {
  all(): Order[] {
    return readJson<Order[]>(ORDERS_FILE, []);
  },

  findById(id: string): Order | undefined {
    return this.all().find((o) => o.id === id);
  },

  findByRef(ref: string): Order | undefined {
    return this.all().find((o) => o.orderRef === ref);
  },

  findBySessionId(sessionId: string): Order | undefined {
    return this.all().find((o) => o.stripeSessionId === sessionId);
  },

  save(order: Order): Order {
    const orders = this.all();
    const idx    = orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) orders[idx] = order;
    else orders.unshift(order);   // newest first
    writeJson(ORDERS_FILE, orders);
    return order;
  },

  updateStatus(id: string, status: Order["status"]): Order | null {
    const orders = this.all();
    const idx    = orders.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    orders[idx] = { ...orders[idx], status, updatedAt: new Date().toISOString() };
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },

  // Update the productionStatus of a single OrderItem within an order.
  // Returns the updated Order, or null if the order or item is not found.
  updateItemProductionStatus(
    orderId:          string,
    itemId:           string,
    productionStatus: ProductionStatus,
  ): Order | null {
    const orders = this.all();
    const idx    = orders.findIndex((o) => o.id === orderId);
    if (idx < 0) return null;
    const itemIdx = orders[idx].items.findIndex((i) => i.id === itemId);
    if (itemIdx < 0) return null;
    orders[idx] = {
      ...orders[idx],
      updatedAt: new Date().toISOString(),
      items: orders[idx].items.map((item, i) =>
        i === itemIdx ? { ...item, productionStatus } : item
      ),
    };
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },
};

/* ══════════════════════════════════════════════════════════════════
   ORDER REFERENCE COUNTER  →  BN-2026-000124
══════════════════════════════════════════════════════════════════ */
const COUNTERS_FILE = "counters.json";

export function generateOrderRef(): string {
  const year     = new Date().getFullYear();
  const key      = `orders_${year}`;
  const counters = readJson<Record<string, number>>(COUNTERS_FILE, {});
  const next     = (counters[key] ?? 0) + 1;
  counters[key]  = next;
  writeJson(COUNTERS_FILE, counters);
  return `BN-${year}-${String(next).padStart(6, "0")}`;
}

/* ══════════════════════════════════════════════════════════════════
   PROVIDERS
══════════════════════════════════════════════════════════════════ */
const PROVIDERS_FILE = "providers.json";

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id:                    "prov_A",
    name:                  "Proveedor Premium",
    email:                 process.env.PROVIDER_A_EMAIL ?? "proveedor_a@ejemplo.com",
    stripeAccountId:       undefined,
    active:                true,
    supportedProductTypes: ["premium_custom"],
    feePercent:            30,
    createdAt:             new Date().toISOString(),
  },
  {
    id:                    "prov_B",
    name:                  "Proveedor Running",
    email:                 process.env.PROVIDER_B_EMAIL ?? "proveedor_b@ejemplo.com",
    stripeAccountId:       undefined,
    active:                true,
    supportedProductTypes: ["running_fullprint"],
    feePercent:            28,
    createdAt:             new Date().toISOString(),
  },
  {
    id:                    "prov_C",
    name:                  "Proveedor Solidaria",
    email:                 process.env.PROVIDER_C_EMAIL ?? "proveedor_c@ejemplo.com",
    stripeAccountId:       undefined,
    active:                true,
    supportedProductTypes: ["solidary_standard"],
    feePercent:            25,
    createdAt:             new Date().toISOString(),
  },
];

export const providersRepo = {
  all(): Provider[] {
    return readJson<Provider[]>(PROVIDERS_FILE, DEFAULT_PROVIDERS);
  },

  findById(id: string): Provider | undefined {
    return this.all().find((p) => p.id === id);
  },

  findByProductType(type: ProductType): Provider | undefined {
    return this.all().find(
      (p) => p.active && p.supportedProductTypes.includes(type)
    );
  },

  save(provider: Provider): Provider {
    const providers = this.all();
    const idx       = providers.findIndex((p) => p.id === provider.id);
    if (idx >= 0) providers[idx] = provider;
    else providers.push(provider);
    writeJson(PROVIDERS_FILE, providers);
    return provider;
  },

  create(data: Omit<Provider, "id" | "createdAt">): Provider {
    const provider: Provider = {
      ...data,
      id:        `prov_${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    return this.save(provider);
  },
};

/* ══════════════════════════════════════════════════════════════════
   PENDING CARTS  (full cart saved before Stripe redirect)
══════════════════════════════════════════════════════════════════ */
const PENDING_FILE = "pending_carts.json";

export const pendingCartsRepo = {
  all(): PendingCart[] {
    return readJson<PendingCart[]>(PENDING_FILE, []);
  },

  save(entry: PendingCart): void {
    const all = this.all();
    const idx = all.findIndex((c) => c.sessionId === entry.sessionId);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    // Prune entries older than 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const pruned = all.filter(
      (c) => new Date(c.createdAt).getTime() > cutoff
    );
    writeJson(PENDING_FILE, pruned);
  },

  findBySessionId(sessionId: string): PendingCart | undefined {
    return this.all().find((c) => c.sessionId === sessionId);
  },

  delete(sessionId: string): void {
    const filtered = this.all().filter((c) => c.sessionId !== sessionId);
    writeJson(PENDING_FILE, filtered);
  },
};

/* ══════════════════════════════════════════════════════════════════
   PAYOUTS
══════════════════════════════════════════════════════════════════ */
const PAYOUTS_FILE = "payouts.json";

export const payoutsRepo = {
  all(): Payout[] {
    return readJson<Payout[]>(PAYOUTS_FILE, []);
  },

  save(payout: Payout): Payout {
    const all = this.all();
    const idx = all.findIndex((p) => p.id === payout.id);
    if (idx >= 0) all[idx] = payout;
    else all.push(payout);
    writeJson(PAYOUTS_FILE, all);
    return payout;
  },

  create(data: Omit<Payout, "id" | "createdAt">): Payout {
    const payout: Payout = {
      ...data,
      id:        randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return this.save(payout);
  },
};
