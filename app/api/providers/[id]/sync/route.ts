import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { providersRepo } from "@/lib/db";
import type { StripeConnectStatus } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════
   POST /api/providers/[id]/sync

   Fetches the Stripe Connect Express account state for a provider
   and persists it to the local store as stripeConnectStatus.

   This powers:
     • Knowing whether a provider can receive payouts
     • Blocking auto-routing to providers with incomplete onboarding
     • Detecting "detailsSubmitted but not yet approved" states

   Returns: { provider } with updated stripeConnectStatus.
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

  if (!provider.stripeAccountId) {
    return NextResponse.json(
      { error: "Provider has no Stripe account — complete onboarding first" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeKey);

  let account: Stripe.Account;
  try {
    account = await stripe.accounts.retrieve(provider.stripeAccountId);
  } catch (err) {
    console.error(`[provider/sync] Stripe API error for ${provider.stripeAccountId}:`, err);
    return NextResponse.json(
      { error: "Failed to retrieve Stripe account" },
      { status: 502 }
    );
  }

  const stripeConnectStatus: StripeConnectStatus = {
    payoutsEnabled:   account.payouts_enabled   ?? false,
    chargesEnabled:   account.charges_enabled   ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    lastSyncedAt:     new Date().toISOString(),
  };

  const updated = providersRepo.save({ ...provider, stripeConnectStatus });

  return NextResponse.json({
    provider: updated,
    stripeConnectStatus,
    readyToReceivePayouts: stripeConnectStatus.payoutsEnabled && stripeConnectStatus.chargesEnabled,
  });
}
