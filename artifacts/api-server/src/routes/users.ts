import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, photosTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { UpdateCurrentUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

const STORAGE_LIMIT_BYTES = 16106127360; // 15 GB

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const user = await db.select().from(usersTable)
    .where(eq(usersTable.clerkUserId, userId)).then(r => r[0]);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = UpdateCurrentUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.clerkUserId, userId))
    .returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

router.get("/users/me/storage", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const [row] = await db.select({
    totalBytes: sql<number>`coalesce(sum(${photosTable.fileSize}), 0)`,
    photoCount: sql<number>`count(*)`,
  }).from(photosTable).where(eq(photosTable.userId, userId));
  res.json({
    totalBytes: Number(row.totalBytes),
    photoCount: Number(row.photoCount),
    limitBytes: STORAGE_LIMIT_BYTES,
  });
});

export default router;
