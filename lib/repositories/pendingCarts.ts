/**
 * Pending carts repository — async PostgreSQL implementation.
 *
 * A pending cart is saved before the Stripe checkout redirect
 * and deleted after a successful webhook processes the payment.
 */
import { eq, lt } from "drizzle-orm";
import { db, pendingCarts } from "../../db";
import type { PendingCart } from "../types";

export const pendingCartsRepo = {

  async save(entry: PendingCart): Promise<void> {
    await db
      .insert(pendingCarts)
      .values({
        sessionId: entry.sessionId,
        cart:      entry.cart as any,
        createdAt: new Date(entry.createdAt),
      })
      .onConflictDoUpdate({
        target: pendingCarts.sessionId,
        set:    { cart: entry.cart as any },
      });

    // Prune carts older than 7 days (best-effort, non-blocking)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    db.delete(pendingCarts)
      .where(lt(pendingCarts.createdAt, cutoff))
      .catch(() => {}); // fire-and-forget
  },

  async findBySessionId(sessionId: string): Promise<PendingCart | undefined> {
    const [row] = await db
      .select()
      .from(pendingCarts)
      .where(eq(pendingCarts.sessionId, sessionId))
      .limit(1);
    if (!row) return undefined;
    return {
      sessionId: row.sessionId,
      cart:      row.cart as any,
      createdAt: row.createdAt.toISOString(),
    };
  },

  async delete(sessionId: string): Promise<void> {
    await db
      .delete(pendingCarts)
      .where(eq(pendingCarts.sessionId, sessionId));
  },
};
