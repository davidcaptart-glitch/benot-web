import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { providersRepo } from "@/lib/db";

/* ══════════════════════════════════════════════════════════════════
   POST /api/providers/[id]/onboard

   Stripe Connect Express onboarding:
   1. Creates a Connected Account for the provider if none exists.
   2. Generates an Account Link for the provider to complete onboarding.
   3. Returns { url } — redirect the provider to this URL.

   Auth: requires x-admin-secret header.
══════════════════════════════════════════════════════════════════ */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const { id } = await params;
  const provider = providersRepo.findById(id);
  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const stripe  = new Stripe(stripeKey);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://benot.store";

  /* ── Create Connected Account if this provider doesn't have one ── */
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
      business_profile: {
        name: provider.name,
        mcc:  "5699", // Misc. Apparel & Accessory Shops
      },
    });
    accountId = account.id;

    // Persist the Stripe account ID
    providersRepo.save({ ...provider, stripeAccountId: accountId });
  }

  /* ── Generate Account Link (expires in ~10 min) ──────────────── */
  const accountLink = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${baseUrl}/api/providers/${id}/onboard`,
    return_url:  `${baseUrl}/admin/providers`,
    type:        "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url, accountId });
}
