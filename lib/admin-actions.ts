"use server";
/**
 * BENOT Admin – Server Actions
 * All admin mutations go through here. Each action revalidates the
 * relevant admin paths so the UI reflects changes immediately.
 */
import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import Stripe from "stripe";

import {
  ordersRepo,
  providersRepo,
  productConfigsRepo,
  generateOrderRef,
} from "./db";
import {
  sendCustomerConfirmationEmail,
  sendProviderProductionEmail,
  sendCustomerStatusEmail,
} from "./email";
import { generateProductionSheet } from "./snapshot";
import type {
  OrderStatus,
  ProductionStatus,
  ProductConfig,
  Provider,
  StripeConnectStatus,
} from "./types";

/* ── helpers ─────────────────────────────────────────────────────── */
function adminBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "https://benot.store";
}

/* ══════════════════════════════════════════════════════════════════
   ORDER ACTIONS
══════════════════════════════════════════════════════════════════ */

/** Update the overall order status. */
export async function updateOrderStatus(ref: string, status: OrderStatus) {
  const order = ordersRepo.findByRef(ref);
  if (!order) throw new Error(`Order ${ref} not found`);
  ordersRepo.updateStatus(order.id, status);
  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/** Update a single item's production status within an order. */
export async function updateItemProductionStatus(
  ref:    string,
  itemId: string,
  status: ProductionStatus,
) {
  const order = ordersRepo.findByRef(ref);
  if (!order) throw new Error(`Order ${ref} not found`);
  const updated = ordersRepo.updateItemProductionStatus(order.id, itemId, status);
  if (!updated) throw new Error("Item not found");

  // Auto-advance order status
  const all       = updated.items;
  const allShipped = all.every((i) => i.productionStatus === "shipped");
  if (allShipped && updated.status !== "shipped") {
    ordersRepo.updateStatus(updated.id, "shipped");
  }

  // Send customer email on key transitions
  if (status === "shipped") {
    sendCustomerStatusEmail(updated, "shipped").catch(console.error);
  } else if (status === "printing") {
    sendCustomerStatusEmail(updated, "in_production").catch(console.error);
  }

  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/** Re-send the customer confirmation email. */
export async function resendCustomerEmail(ref: string) {
  const order = ordersRepo.findByRef(ref);
  if (!order) throw new Error(`Order ${ref} not found`);
  await sendCustomerConfirmationEmail(order);
  revalidatePath(`/admin/orders/${ref}`);
}

/** Re-send the production email for a specific provider. */
export async function resendProviderEmail(ref: string, providerId: string) {
  const order    = ordersRepo.findByRef(ref);
  if (!order) throw new Error(`Order ${ref} not found`);
  const provider = providersRepo.findById(providerId);
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  const providerItems = order.items.filter((i) => i.providerId === providerId);
  if (providerItems.length === 0) throw new Error("No items for this provider");

  // Determine which cart indices belong to this provider
  const providerIndices = order.items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.providerId === providerId)
    .map(({ idx }) => idx);

  const providerAssets = (order.frozenAssets ?? [])
    .filter((a) => providerIndices.includes(a.cartItemIndex));

  const pdfPath = order.productionPdfs?.[providerId];

  // Regenerate PDF if it doesn't exist
  let finalPdfPath = pdfPath;
  if (!finalPdfPath) {
    try {
      finalPdfPath = await generateProductionSheet(order, provider, providerItems, providerAssets);
    } catch { /* non-critical */ }
  }

  await sendProviderProductionEmail(order, provider, providerItems, providerAssets, finalPdfPath);
  revalidatePath(`/admin/orders/${ref}`);
}

/* ══════════════════════════════════════════════════════════════════
   PROVIDER ACTIONS
══════════════════════════════════════════════════════════════════ */

/** Create or update a provider. */
export async function saveProvider(data: Omit<Provider, "createdAt">) {
  const existing = providersRepo.findById(data.id);
  if (existing) {
    providersRepo.save({ ...existing, ...data });
  } else {
    providersRepo.create(data);
  }
  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${data.id}`);
}

/** Toggle provider active state. */
export async function toggleProviderActive(id: string) {
  const provider = providersRepo.findById(id);
  if (!provider) throw new Error(`Provider ${id} not found`);
  providersRepo.save({ ...provider, active: !provider.active });
  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${id}`);
}

/** Start Stripe Connect Express onboarding — redirects to Stripe. */
export async function onboardProvider(id: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe not configured");

  const provider = providersRepo.findById(id);
  if (!provider) throw new Error(`Provider ${id} not found`);

  const stripe  = new Stripe(stripeKey);
  const baseUrl = adminBaseUrl();

  let accountId = provider.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type:         "express",
      country:      "ES",
      email:        provider.email,
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      business_profile: { name: provider.name, mcc: "5699" },
    });
    accountId = account.id;
    const stripeConnectStatus: StripeConnectStatus = {
      payoutsEnabled:   account.payouts_enabled   ?? false,
      chargesEnabled:   account.charges_enabled   ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      lastSyncedAt:     new Date().toISOString(),
    };
    providersRepo.save({ ...provider, stripeAccountId: accountId, stripeConnectStatus });
  }

  const accountLink = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${baseUrl}/admin/providers/${id}`,
    return_url:  `${baseUrl}/admin/providers/${id}`,
    type:        "account_onboarding",
  });

  redirect(accountLink.url);
}

/** Sync Stripe Connect state from Stripe API. */
export async function syncProviderStripe(id: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe not configured");

  const provider = providersRepo.findById(id);
  if (!provider?.stripeAccountId) throw new Error("Provider has no Stripe account");

  const stripe   = new Stripe(stripeKey);
  const account  = await stripe.accounts.retrieve(provider.stripeAccountId);

  const stripeConnectStatus: StripeConnectStatus = {
    payoutsEnabled:   account.payouts_enabled   ?? false,
    chargesEnabled:   account.charges_enabled   ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    lastSyncedAt:     new Date().toISOString(),
  };

  providersRepo.save({ ...provider, stripeConnectStatus });
  revalidatePath(`/admin/providers/${id}`);
  revalidatePath("/admin/providers");
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CONFIG ACTIONS
══════════════════════════════════════════════════════════════════ */

/** Save a product configuration (prices, margins, shipping). */
export async function saveProductConfig(config: ProductConfig) {
  productConfigsRepo.save(config);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}
