/**
 * BENOT – Data layer public API
 *
 * Re-exports all async repositories from lib/repositories/.
 * All functions are now async (Promise-based) — callers must await them.
 *
 * DATA_DIR is kept for the snapshot module which writes files to disk.
 */
import path from "path";

export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

export { ordersRepo, generateOrderRef } from "./repositories/orders";
export { providersRepo }                from "./repositories/providers";
export { payoutsRepo }                  from "./repositories/payouts";
export { productConfigsRepo }           from "./repositories/productConfigs";
export { pendingCartsRepo }             from "./repositories/pendingCarts";
export { adminUserRepo }                from "./repositories/adminUser";
