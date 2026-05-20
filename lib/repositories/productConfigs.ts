/**
 * Product configs repository — async PostgreSQL implementation.
 */
import { db, productConfigs } from "../../db";
import { eq } from "drizzle-orm";
import type { ProductConfig, ProductType } from "../types";

const DEFAULT_CONFIGS: ProductConfig[] = [
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
    updatedAt:               new Date().toISOString(),
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
    updatedAt:               new Date().toISOString(),
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
    updatedAt:               new Date().toISOString(),
  },
];

function rowToConfig(row: typeof productConfigs.$inferSelect): ProductConfig {
  return {
    productType:             row.productType,
    basePrice:               row.basePrice,
    providerCost:            row.providerCost,
    shippingCost:            row.shippingCost,
    urgentShippingCost:      row.urgentShippingCost,
    freeShippingThreshold:   row.freeShippingThreshold,
    discountActive:          row.discountActive,
    discountPercent:         row.discountPercent,
    active:                  row.active,
    estimatedProductionDays: row.estimatedProductionDays,
    estimatedShippingDays:   row.estimatedShippingDays,
    updatedAt:               row.updatedAt.toISOString(),
  };
}

export const productConfigsRepo = {

  async all(): Promise<ProductConfig[]> {
    const rows = await db.select().from(productConfigs);
    if (rows.length === 0) return DEFAULT_CONFIGS;
    return rows.map(rowToConfig);
  },

  async findByType(type: ProductType): Promise<ProductConfig> {
    const [row] = await db
      .select()
      .from(productConfigs)
      .where(eq(productConfigs.productType, type))
      .limit(1);
    if (!row) {
      return DEFAULT_CONFIGS.find((c) => c.productType === type)!;
    }
    return rowToConfig(row);
  },

  async save(config: ProductConfig): Promise<ProductConfig> {
    const now = new Date();
    await db
      .insert(productConfigs)
      .values({
        productType:             config.productType,
        basePrice:               config.basePrice,
        providerCost:            config.providerCost,
        shippingCost:            config.shippingCost,
        urgentShippingCost:      config.urgentShippingCost,
        freeShippingThreshold:   config.freeShippingThreshold,
        discountActive:          config.discountActive,
        discountPercent:         config.discountPercent,
        active:                  config.active,
        estimatedProductionDays: config.estimatedProductionDays,
        estimatedShippingDays:   config.estimatedShippingDays,
        updatedAt:               now,
      })
      .onConflictDoUpdate({
        target: productConfigs.productType,
        set:    {
          basePrice:               config.basePrice,
          providerCost:            config.providerCost,
          shippingCost:            config.shippingCost,
          urgentShippingCost:      config.urgentShippingCost,
          freeShippingThreshold:   config.freeShippingThreshold,
          discountActive:          config.discountActive,
          discountPercent:         config.discountPercent,
          active:                  config.active,
          estimatedProductionDays: config.estimatedProductionDays,
          estimatedShippingDays:   config.estimatedShippingDays,
          updatedAt:               now,
        },
      });

    return { ...config, updatedAt: now.toISOString() };
  },
};
