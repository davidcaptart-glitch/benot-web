/**
 * BENOT – Database seed
 *
 * Inserts:
 *  1. Default product configs  (premium_custom, running_fullprint, solidary_standard)
 *  2. Default providers        (prov_A, prov_B, prov_C)
 *  3. Admin user               (from ADMIN_EMAIL + ADMIN_PASSWORD env vars)
 *
 * Run with:  npx tsx db/seed.ts
 * Or via:    npm run db:seed
 *
 * Safe to run multiple times — uses INSERT … ON CONFLICT DO NOTHING.
 */
import { drizzle }  from "drizzle-orm/postgres-js";
import postgres      from "postgres";
import bcrypt        from "bcryptjs";
import "dotenv/config";

import {
  providers,
  providerProductTypes,
  productConfigs,
  adminUser,
} from "./schema";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }

async function main() {
  const client = postgres(url!, { max: 1 });
  const db     = drizzle(client);

  /* ── Product configs ─────────────────────────────────────────────── */
  const now = new Date();

  await db
    .insert(productConfigs)
    .values([
      {
        productType:             "premium_custom",
        basePrice:               4290,
        providerCost:            2500,
        shippingCost:            499,
        urgentShippingCost:      999,
        freeShippingThreshold:   8000,
        discountActive:          false,
        discountPercent:         0,
        active:                  true,
        estimatedProductionDays: 3,
        estimatedShippingDays:   5,
        updatedAt:               now,
      },
      {
        productType:             "running_fullprint",
        basePrice:               3790,
        providerCost:            2200,
        shippingCost:            499,
        urgentShippingCost:      999,
        freeShippingThreshold:   8000,
        discountActive:          false,
        discountPercent:         0,
        active:                  true,
        estimatedProductionDays: 4,
        estimatedShippingDays:   5,
        updatedAt:               now,
      },
      {
        productType:             "solidary_standard",
        basePrice:               2790,
        providerCost:            1800,
        shippingCost:            499,
        urgentShippingCost:      999,
        freeShippingThreshold:   8000,
        discountActive:          false,
        discountPercent:         0,
        active:                  true,
        estimatedProductionDays: 2,
        estimatedShippingDays:   5,
        updatedAt:               now,
      },
    ])
    .onConflictDoNothing();

  console.log("✅  Product configs seeded.");

  /* ── Providers ───────────────────────────────────────────────────── */
  const providerRows = [
    {
      id:         "prov_A",
      name:       "Proveedor Premium",
      email:      process.env.PROVIDER_A_EMAIL ?? "proveedor_a@ejemplo.com",
      active:     true,
      feePercent: 30,
      types:      ["premium_custom"] as const,
    },
    {
      id:         "prov_B",
      name:       "Proveedor Running",
      email:      process.env.PROVIDER_B_EMAIL ?? "proveedor_b@ejemplo.com",
      active:     true,
      feePercent: 28,
      types:      ["running_fullprint"] as const,
    },
    {
      id:         "prov_C",
      name:       "Proveedor Solidaria",
      email:      process.env.PROVIDER_C_EMAIL ?? "proveedor_c@ejemplo.com",
      active:     true,
      feePercent: 25,
      types:      ["solidary_standard"] as const,
    },
  ];

  for (const p of providerRows) {
    const { types, ...row } = p;
    await db.insert(providers).values(row).onConflictDoNothing();
    for (const t of types) {
      await db
        .insert(providerProductTypes)
        .values({ providerId: p.id, productType: t })
        .onConflictDoNothing();
    }
  }

  console.log("✅  Providers seeded.");

  /* ── Admin user ──────────────────────────────────────────────────── */
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed.\n" +
      "    Set them in .env and re-run to create the admin account."
    );
  } else {
    const hash = await bcrypt.hash(password, 12);
    await db
      .insert(adminUser)
      .values({ id: 1, email, passwordHash: hash, updatedAt: now })
      .onConflictDoNothing();
    console.log(`✅  Admin user seeded: ${email}`);
  }

  await client.end();
  console.log("🎉  Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
