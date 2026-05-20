/* ─────────────────────────────────────────────────────────────────
   BENOT Platform — Shared type definitions
   ─────────────────────────────────────────────────────────────── */

// ── Product ──────────────────────────────────────────────────────
export type ProductType =
  | "premium_custom"      // Camiseta personalizada (color + frase + diseño)
  | "running_fullprint"   // Camiseta running fullprint
  | "solidary_standard";  // Camiseta solidaria #YoTeEmpujo

export const PRODUCT_TYPE_NAMES: Record<ProductType, string> = {
  premium_custom:    "Camiseta personalizada premium",
  running_fullprint: "Camiseta multideporte 100% fullprint personalizada",
  solidary_standard: "Camiseta personalizada estándar",
};

// ── Order lifecycle ───────────────────────────────────────────────
export type OrderStatus =
  | "pending"          // sesión Stripe creada, no pagada
  | "paid"             // pago confirmado por webhook
  | "production_sent"  // email enviado al proveedor
  | "in_production"    // proveedor ha confirmado recepción
  | "shipped"          // en camino
  | "delivered";       // entregado

// ── Sizes map ────────────────────────────────────────────────────
export type SizeMap = Record<string, number>;

// ── Cart items (front-end payload, preserved 1:1) ─────────────────
export interface CartItemPersonalizada {
  tipo:            "personalizada";
  color:           string;
  fraseCode:       string;
  disenoCode:      string;
  disenoCategoria: string;
  sizes:           SizeMap;
}
export interface CartItemFixed {
  tipo:  "running" | "yoteempujo";
  code:  string;
  src:   string;
  sizes: SizeMap;
}
export type CartItem = CartItemPersonalizada | CartItemFixed;

// ── Order item ───────────────────────────────────────────────────
export interface OrderItem {
  id:          string;
  productType: ProductType;
  productName: string;
  providerId:  string | null;
  // --- personalizada fields ---
  color?:           string;
  phraseCode?:      string;
  designCode?:      string;
  designCategory?:  string;
  // --- running / yoteempujo fields ---
  itemCode?: string;
  // --- common ---
  sizes:     SizeMap;
  quantity:  number;       // total units
  unitPrice: number;       // cents
  subtotal:  number;       // cents (unitPrice × quantity)
}

// ── Order ────────────────────────────────────────────────────────
export interface ShippingAddress {
  name:        string;
  line1:       string;
  line2?:      string;
  city:        string;
  postal_code: string;
  state?:      string;
  country:     string;
}

export interface Order {
  id:               string;   // uuid
  orderRef:         string;   // BN-2026-000124
  stripeSessionId:  string;
  status:           OrderStatus;
  customerName:     string;
  customerEmail:    string;
  customerPhone?:   string;
  shippingAddress?: ShippingAddress;
  shippingOption?:  string;   // 'Envío estándar' | 'Envío urgente'
  items:            OrderItem[];
  subtotalAmount:   number;   // cents
  shippingAmount:   number;   // cents
  totalAmount:      number;   // cents
  currency:         string;
  createdAt:        string;   // ISO8601
  updatedAt:        string;   // ISO8601
}

// ── Provider ─────────────────────────────────────────────────────
export interface Provider {
  id:                    string;
  name:                  string;
  email:                 string;
  stripeAccountId?:      string;   // Stripe Connect Express account
  active:                boolean;
  supportedProductTypes: ProductType[];
  feePercent:            number;   // BENOT margin kept (0-100)
  createdAt:             string;
}

// ── Payout record ────────────────────────────────────────────────
export interface Payout {
  id:               string;
  orderId:          string;
  providerId:       string;
  amount:           number;   // cents sent to provider
  stripeTransferId?: string;
  status:           "pending" | "transferred" | "failed";
  createdAt:        string;
}

// ── Pending cart (stored before Stripe checkout) ──────────────────
export interface PendingCart {
  sessionId:  string;
  cart:       CartItem[];
  createdAt:  string;
}
