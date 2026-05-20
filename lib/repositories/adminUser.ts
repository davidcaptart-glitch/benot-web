/**
 * Admin user repository — async PostgreSQL implementation.
 *
 * Single admin user only (id = 1).
 * bcrypt hashing happens in lib/auth.ts — this repo only stores/fetches.
 */
import { eq }     from "drizzle-orm";
import { db, adminUser } from "../../db";

export interface AdminUserRow {
  id:           number;
  email:        string;
  passwordHash: string;
  createdAt:    string;
  updatedAt:    string;
}

export const adminUserRepo = {

  async get(): Promise<AdminUserRow | undefined> {
    const [row] = await db
      .select()
      .from(adminUser)
      .where(eq(adminUser.id, 1))
      .limit(1);
    if (!row) return undefined;
    return {
      id:           row.id,
      email:        row.email,
      passwordHash: row.passwordHash,
      createdAt:    row.createdAt.toISOString(),
      updatedAt:    row.updatedAt.toISOString(),
    };
  },

  async upsert(email: string, passwordHash: string): Promise<void> {
    const now = new Date();
    await db
      .insert(adminUser)
      .values({ id: 1, email, passwordHash, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: adminUser.id,
        set:    { email, passwordHash, updatedAt: now },
      });
  },
};
