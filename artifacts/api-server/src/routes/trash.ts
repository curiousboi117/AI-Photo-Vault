import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db, photosTable, photoTagsTable, albumPhotosTable, albumsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { RestorePhotoParams, PermanentlyDeletePhotoParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichPhotos(photoIds: number[], userId: string) {
  if (photoIds.length === 0) return [];
  const photos = await db.select().from(photosTable)
    .where(and(inArray(photosTable.id, photoIds), eq(photosTable.userId, userId)));
  const tags = await db.select().from(photoTagsTable).where(inArray(photoTagsTable.photoId, photoIds));
  const albumRows = await db.select({ photoId: albumPhotosTable.photoId, id: albumsTable.id, name: albumsTable.name })
    .from(albumPhotosTable)
    .innerJoin(albumsTable, eq(albumPhotosTable.albumId, albumsTable.id))
    .where(inArray(albumPhotosTable.photoId, photoIds));
  return photos.map(p => ({
    ...p,
    tags: tags.filter(t => t.photoId === p.id).map(t => t.tag),
    albums: albumRows.filter(a => a.photoId === p.id).map(a => ({ id: a.id, name: a.name })),
  }));
}

router.get("/trash", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const photos = await db.select().from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, true)));
  const enriched = await enrichPhotos(photos.map(p => p.id), userId);
  res.json(enriched);
});

router.delete("/trash", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const trashed = await db.select().from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, true)));
  if (trashed.length > 0) {
    const ids = trashed.map(p => p.id);
    await db.delete(photoTagsTable).where(inArray(photoTagsTable.photoId, ids));
    await db.delete(albumPhotosTable).where(inArray(albumPhotosTable.photoId, ids));
    await db.delete(photosTable).where(inArray(photosTable.id, ids));
  }
  res.sendStatus(204);
});

router.post("/trash/:id/restore", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = RestorePhotoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [updated] = await db.update(photosTable)
    .set({ isTrashed: false, trashedAt: null })
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId), eq(photosTable.isTrashed, true)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Photo not found in trash" }); return; }
  const [enriched] = await enrichPhotos([updated.id], userId);
  res.json(enriched);
});

router.delete("/trash/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = PermanentlyDeletePhotoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const photo = await db.select().from(photosTable)
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId), eq(photosTable.isTrashed, true)))
    .then(r => r[0]);
  if (!photo) { res.status(404).json({ error: "Photo not found in trash" }); return; }
  await db.delete(photoTagsTable).where(eq(photoTagsTable.photoId, params.data.id));
  await db.delete(albumPhotosTable).where(eq(albumPhotosTable.photoId, params.data.id));
  await db.delete(photosTable).where(eq(photosTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
