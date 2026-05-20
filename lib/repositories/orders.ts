/**
 * Orders repository — async PostgreSQL implementation.
 *
 * All methods return domain types (Order, OrderItem) — same interface
 * as the old JSON repo so callers need minimal changes (just add await).
 */
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID }     from "crypto";
import { db, orders, orderItems, orderEvents, counters } from "../../db";
import type {
  Order,
  OrderItem,
  OrderStatus,
  ProductionStatus,
  FrozenAsset,
} from "../types";

/* ── Mapping helpers ──────────────────────────────────────────────── */

function rowToOrderItem(row: typeof orderItems.$inferSelect): OrderItem {
  return {
    id:               row.id,
    productType:      row.productType,
    productName:      row.productName,
    providerId:       row.providerId,
    productionStatus: row.productionStatus,
    color:            row.color ?? undefined,
    phraseCode:       row.phraseCode ?? undefined,
    designCode:       row.designCode ?? undefined,
    designCategory:   row.designCategory ?? undefined,
    printZones:       (row.printZones as any) ?? undefined,
    finalPreview:     row.finalPreview ?? undefined,
    itemCode:         row.itemCode ?? undefined,
    sizes:            (row.sizes as any) ?? {},
    quantity:         row.quantity,
    unitPrice:        row.unitPrice,
    subtotal:         row.subtotal,
  };
}

function rowsToOrder(
  orderRow: typeof orders.$inferSelect,
  itemRows:  (typeof orderItems.$inferSelect)[],
): Order {
  return {
    id:              orderRow.id,
    orderRef:        orderRow.orderRef,
    stripeSessionId: orderRow.stripeSessionId,
    status:          orderRow.status,
    customerName:    orderRow.customerName,
    customerEmail:   orderRow.customerEmail,
    customerPhone:   orderRow.customerPhone ?? undefined,
    shippingAddress: (orderRow.shippingAddress as any) ?? undefined,
    shippingOption:  orderRow.shippingOption ?? undefined,
    items:           itemRows.map(rowToOrderItem),
    subtotalAmount:  orderRow.subtotalAmount,
    shippingAmount:  orderRow.shippingAmount,
    totalAmount:     orderRow.totalAmount,
    currency:        orderRow.currency,
    frozenAssets:    (orderRow.frozenAssets as FrozenAsset[]) ?? undefined,
    productionPdfs:  (orderRow.productionPdfs as Record<string, string>) ?? undefined,
    createdAt:       orderRow.createdAt.toISOString(),
    updatedAt:       orderRow.updatedAt.toISOString(),
  };
}

/* ── Repository ───────────────────────────────────────────────────── */

export const ordersRepo = {

  async all(): Promise<Order[]> {
    const orderRows = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    if (orderRows.length === 0) return [];

    const itemRows = await db
      .select()
      .from(orderItems)
      .orderBy(orderItems.createdAt);

    const itemsByOrder = new Map<string, (typeof orderItems.$inferSelect)[]>();
    for (const item of itemRows) {
      const arr = itemsByOrder.get(item.orderId) ?? [];
      arr.push(item);
      itemsByOrder.set(item.orderId, arr);
    }

    return orderRows.map((o) => rowsToOrder(o, itemsByOrder.get(o.id) ?? []));
  },

  async findById(id: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!row) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return rowsToOrder(row, items);
  },

  async findByRef(ref: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.orderRef, ref)).limit(1);
    if (!row) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
    return rowsToOrder(row, items);
  },

  async findBySessionId(sessionId: string): Promise<Order | undefined> {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId))
      .limit(1);
    if (!row) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
    return rowsToOrder(row, items);
  },

  /** Full upsert — inserts or replaces an order and all its items. */
  async save(order: Order): Promise<Order> {
    await db.transaction(async (tx) => {
      await tx
        .insert(orders)
        .values({
          id:              order.id,
          orderRef:        order.orderRef,
          stripeSessionId: order.stripeSessionId,
          status:          order.status,
          customerName:    order.customerName,
          customerEmail:   order.customerEmail,
          customerPhone:   order.customerPhone ?? null,
          shippingAddress: order.shippingAddress ?? null,
          shippingOption:  order.shippingOption ?? null,
          subtotalAmount:  order.subtotalAmount,
          shippingAmount:  order.shippingAmount,
          totalAmount:     order.totalAmount,
          currency:        order.currency,
          frozenAssets:    (order.frozenAssets as any) ?? null,
          productionPdfs:  (order.productionPdfs as any) ?? null,
          createdAt:       new Date(order.createdAt),
          updatedAt:       new Date(order.updatedAt),
        })
        .onConflictDoUpdate({
          target: orders.id,
          set:    {
            status:         order.status,
            customerName:   order.customerName,
            customerEmail:  order.customerEmail,
            customerPhone:  order.customerPhone ?? null,
            shippingAddress: order.shippingAddress ?? null,
            shippingOption:  order.shippingOption ?? null,
            frozenAssets:   (order.frozenAssets as any) ?? null,
            productionPdfs: (order.productionPdfs as any) ?? null,
            updatedAt:      new Date(order.updatedAt),
          },
        });

      // Delete + re-insert items (simplest idempotent approach for full saves)
      await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));

      if (order.items.length > 0) {
        await tx.insert(orderItems).values(
          order.items.map((item) => ({
            id:               item.id,
            orderId:          order.id,
            productType:      item.productType,
            productName:      item.productName,
            providerId:       item.providerId ?? null,
            productionStatus: item.productionStatus ?? "pending",
            color:            item.color ?? null,
            phraseCode:       item.phraseCode ?? null,
            designCode:       item.designCode ?? null,
            designCategory:   item.designCategory ?? null,
            printZones:       (item.printZones as any) ?? null,
            finalPreview:     item.finalPreview ?? null,
            itemCode:         item.itemCode ?? null,
            sizes:            item.sizes as any,
            quantity:         item.quantity,
            unitPrice:        item.unitPrice,
            subtotal:         item.subtotal,
          }))
        );
      }
    });

    return order;
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const now = new Date();
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: now })
      .where(eq(orders.id, orderId))
      .returning();
    if (!updated) return null;

    await db.insert(orderEvents).values({
      orderId,
      event: "status_changed",
      data:  { status },
    });

    return (await this.findById(orderId)) ?? null;
  },

  async updateStatusByRef(ref: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.findByRef(ref);
    if (!order) return null;
    return this.updateStatus(order.id, status);
  },

  async updateItemProductionStatus(
    orderId:          string,
    itemId:           string,
    productionStatus: ProductionStatus,
  ): Promise<Order | null> {
    const now = new Date();
    const [updated] = await db
      .update(orderItems)
      .set({ productionStatus, updatedAt: now })
      .where(eq(orderItems.id, itemId))
      .returning();
    if (!updated) return null;

    await db
      .update(orders)
      .set({ updatedAt: now })
      .where(eq(orders.id, orderId));

    await db.insert(orderEvents).values({
      orderId,
      event: "item_production_status_changed",
      data:  { itemId, productionStatus },
    });

    return (await this.findById(orderId)) ?? null;
  },

  /** Patch only the frozenAssets and productionPdfs fields. */
  async patchAssets(
    orderId:        string,
    frozenAssets:   FrozenAsset[],
    productionPdfs: Record<string, string>,
  ): Promise<void> {
    await db
      .update(orders)
      .set({
        frozenAssets:   frozenAssets as any,
        productionPdfs: productionPdfs as any,
        updatedAt:      new Date(),
      })
      .where(eq(orders.id, orderId));
  },
};

/* ── Order reference counter ─────────────────────────────────────── */

/**
 * Generates the next BN-{year}-{000001} reference atomically.
 * Works inside or outside a transaction.
 */
export async function generateOrderRef(
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<string> {
  const year = new Date().getFullYear();
  const key  = `orders_${year}`;
  const client = tx ?? db;

  const [row] = await (client as typeof db)
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({
      target: counters.key,
      set:    { value: sql`${counters.value} + 1` },
    })
    .returning({ value: counters.value });

  return `BN-${year}-${String(row.value).padStart(6, "0")}`;
}
