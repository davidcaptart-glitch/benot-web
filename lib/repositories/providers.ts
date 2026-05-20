/**
 * Providers repository — async PostgreSQL implementation.
 */
import { eq, inArray } from "drizzle-orm";
import { randomUUID }   from "crypto";
import { db, providers, providerProductTypes } from "../../db";
import type { Provider, ProductType, StripeConnectStatus } from "../types";

/* ── Mapping helper ─────────────────────────────────────────────── */

async function rowToProvider(
  row: typeof providers.$inferSelect
): Promise<Provider> {
  const typeRows = await db
    .select()
    .from(providerProductTypes)
    .where(eq(providerProductTypes.providerId, row.id));

  const stripeConnectStatus: StripeConnectStatus | undefined =
    row.stripeAccountId
      ? {
          payoutsEnabled:   row.stripePayoutsEnabled   ?? false,
          chargesEnabled:   row.stripeChargesEnabled   ?? false,
          detailsSubmitted: row.stripeDetailsSubmitted ?? false,
          lastSyncedAt:     row.stripeLastSyncedAt?.toISOString() ?? new Date(0).toISOString(),
        }
      : undefined;

  return {
    id:                    row.id,
    name:                  row.name,
    email:                 row.email,
    stripeAccountId:       row.stripeAccountId ?? undefined,
    stripeConnectStatus,
    active:                row.active,
    supportedProductTypes: typeRows.map((t) => t.productType as ProductType),
    feePercent:            row.feePercent,
    createdAt:             row.createdAt.toISOString(),
  };
}

async function rowsToProviders(
  rows: (typeof providers.$inferSelect)[]
): Promise<Provider[]> {
  if (rows.length === 0) return [];

  const ids      = rows.map((r) => r.id);
  const typeRows = await db
    .select()
    .from(providerProductTypes)
    .where(inArray(providerProductTypes.providerId, ids));

  const typesByProvider = new Map<string, ProductType[]>();
  for (const t of typeRows) {
    const arr = typesByProvider.get(t.providerId) ?? [];
    arr.push(t.productType as ProductType);
    typesByProvider.set(t.providerId, arr);
  }

  return rows.map((row) => {
    const stripeConnectStatus: StripeConnectStatus | undefined =
      row.stripeAccountId
        ? {
            payoutsEnabled:   row.stripePayoutsEnabled   ?? false,
            chargesEnabled:   row.stripeChargesEnabled   ?? false,
            detailsSubmitted: row.stripeDetailsSubmitted ?? false,
            lastSyncedAt:     row.stripeLastSyncedAt?.toISOString() ?? new Date(0).toISOString(),
          }
        : undefined;

    return {
      id:                    row.id,
      name:                  row.name,
      email:                 row.email,
      stripeAccountId:       row.stripeAccountId ?? undefined,
      stripeConnectStatus,
      active:                row.active,
      supportedProductTypes: typesByProvider.get(row.id) ?? [],
      feePercent:            row.feePercent,
      createdAt:             row.createdAt.toISOString(),
    };
  });
}

/* ── Repository ───────────────────────────────────────────────────── */

export const providersRepo = {

  async all(): Promise<Provider[]> {
    const rows = await db.select().from(providers);
    return rowsToProviders(rows);
  },

  async findById(id: string): Promise<Provider | undefined> {
    const [row] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);
    return row ? rowToProvider(row) : undefined;
  },

  async findByProductType(type: ProductType): Promise<Provider | undefined> {
    // Find providers that support this type and are active
    const typeRows = await db
      .select()
      .from(providerProductTypes)
      .where(eq(providerProductTypes.productType, type));

    if (typeRows.length === 0) return undefined;

    const ids = typeRows.map((t) => t.providerId);
    const [row] = await db
      .select()
      .from(providers)
      .where(eq(providers.active, true))
      .limit(1);

    // Filter by supported IDs in JS (simpler than a JOIN for small tables)
    const activeRows = await db
      .select()
      .from(providers)
      .where(eq(providers.active, true));

    const matching = activeRows.find((r) => ids.includes(r.id));
    return matching ? rowToProvider(matching) : undefined;
  },

  async save(provider: Provider): Promise<Provider> {
    const { supportedProductTypes, stripeConnectStatus, ...rest } = provider;

    await db.transaction(async (tx) => {
      await tx
        .insert(providers)
        .values({
          id:                     rest.id,
          name:                   rest.name,
          email:                  rest.email,
          stripeAccountId:        rest.stripeAccountId ?? null,
          stripePayoutsEnabled:   stripeConnectStatus?.payoutsEnabled   ?? null,
          stripeChargesEnabled:   stripeConnectStatus?.chargesEnabled   ?? null,
          stripeDetailsSubmitted: stripeConnectStatus?.detailsSubmitted ?? null,
          stripeLastSyncedAt:     stripeConnectStatus?.lastSyncedAt
            ? new Date(stripeConnectStatus.lastSyncedAt)
            : null,
          active:                 rest.active,
          feePercent:             rest.feePercent,
          createdAt:              new Date(rest.createdAt),
        })
        .onConflictDoUpdate({
          target: providers.id,
          set:    {
            name:                   rest.name,
            email:                  rest.email,
            stripeAccountId:        rest.stripeAccountId ?? null,
            stripePayoutsEnabled:   stripeConnectStatus?.payoutsEnabled   ?? null,
            stripeChargesEnabled:   stripeConnectStatus?.chargesEnabled   ?? null,
            stripeDetailsSubmitted: stripeConnectStatus?.detailsSubmitted ?? null,
            stripeLastSyncedAt:     stripeConnectStatus?.lastSyncedAt
              ? new Date(stripeConnectStatus.lastSyncedAt)
              : null,
            active:                 rest.active,
            feePercent:             rest.feePercent,
          },
        });

      // Replace product types
      await tx
        .delete(providerProductTypes)
        .where(eq(providerProductTypes.providerId, rest.id));

      if (supportedProductTypes.length > 0) {
        await tx.insert(providerProductTypes).values(
          supportedProductTypes.map((t) => ({
            providerId:  rest.id,
            productType: t,
          }))
        );
      }
    });

    return provider;
  },

  async create(data: Omit<Provider, "id" | "createdAt">): Promise<Provider> {
    const provider: Provider = {
      ...data,
      id:        `prov_${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    return this.save(provider);
  },

  /** Update only the Stripe Connect status fields. */
  async updateStripeStatus(
    id: string,
    status: StripeConnectStatus,
    stripeAccountId: string,
  ): Promise<void> {
    await db
      .update(providers)
      .set({
        stripeAccountId,
        stripePayoutsEnabled:   status.payoutsEnabled,
        stripeChargesEnabled:   status.chargesEnabled,
        stripeDetailsSubmitted: status.detailsSubmitted,
        stripeLastSyncedAt:     new Date(status.lastSyncedAt),
      })
      .where(eq(providers.id, id));
  },

  async toggleActive(id: string): Promise<void> {
    const [row] = await db
      .select({ active: providers.active })
      .from(providers)
      .where(eq(providers.id, id))
      .limit(1);
    if (!row) return;
    await db
      .update(providers)
      .set({ active: !row.active })
      .where(eq(providers.id, id));
  },
};
