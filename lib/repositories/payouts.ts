/**
 * Payouts repository — async PostgreSQL implementation.
 */
import { eq }       from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, payouts } from "../../db";
import type { Payout } from "../types";

function rowToPayout(row: typeof payouts.$inferSelect): Payout {
  return {
    id:               row.id,
    orderId:          row.orderId,
    providerId:       row.providerId,
    amount:           row.amount,
    stripeTransferId: row.stripeTransferId ?? undefined,
    status:           row.status,
    createdAt:        row.createdAt.toISOString(),
  };
}

export const payoutsRepo = {

  async all(): Promise<Payout[]> {
    const rows = await db.select().from(payouts);
    return rows.map(rowToPayout);
  },

  async findByOrder(orderId: string): Promise<Payout[]> {
    const rows = await db
      .select()
      .from(payouts)
      .where(eq(payouts.orderId, orderId));
    return rows.map(rowToPayout);
  },

  async save(payout: Payout): Promise<Payout> {
    await db
      .insert(payouts)
      .values({
        id:               payout.id,
        orderId:          payout.orderId,
        providerId:       payout.providerId,
        amount:           payout.amount,
        stripeTransferId: payout.stripeTransferId ?? null,
        status:           payout.status,
        createdAt:        new Date(payout.createdAt),
      })
      .onConflictDoUpdate({
        target: payouts.id,
        set:    {
          stripeTransferId: payout.stripeTransferId ?? null,
          status:           payout.status,
          updatedAt:        new Date(),
        },
      });
    return payout;
  },

  async create(data: Omit<Payout, "id" | "createdAt">): Promise<Payout> {
    const payout: Payout = {
      ...data,
      id:        randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return this.save(payout);
  },
};
