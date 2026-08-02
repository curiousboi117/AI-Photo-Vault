import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // JIT provision local user record
  let user = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, userId)).then(r => r[0]);
  if (!user) {
    const email = (auth?.sessionClaims?.email as string) ?? "";
    const [newUser] = await db.insert(usersTable).values({ clerkUserId: userId, email }).returning();
    user = newUser;
  }
  (req as any).clerkUserId = userId;
  (req as any).localUser = user;
  next();
}
