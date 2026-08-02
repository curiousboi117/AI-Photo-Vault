import { Router, type IRouter } from "express";
import { and, eq, desc, ilike, or, sql, inArray } from "drizzle-orm";
import { db, photosTable, albumPhotosTable, albumsTable, photoTagsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreatePhotoBody,
  UpdatePhotoBody,
  UpdatePhotoParams,
  GetPhotoParams,
  DeletePhotoParams,
  ListPhotosQueryParams,
  AddPhotoTagParams,
  AddPhotoTagBody,
  RemovePhotoTagParams,
  GetPhotoTimelineQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichPhoto(photoId: number, userId: string) {
  const photo = await db.select().from(photosTable)
    .where(and(eq(photosTable.id, photoId), eq(photosTable.userId, userId)))
    .then(r => r[0]);
  if (!photo) return null;
  const tags = await db.select({ tag: photoTagsTable.tag })
    .from(photoTagsTable).where(eq(photoTagsTable.photoId, photoId));
  const albumRows = await db.select({ id: albumsTable.id, name: albumsTable.name })
    .from(albumPhotosTable)
    .innerJoin(albumsTable, eq(albumPhotosTable.albumId, albumsTable.id))
    .where(eq(albumPhotosTable.photoId, photoId));
  return { ...photo, tags: tags.map(t => t.tag), albums: albumRows };
}

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

router.get("/photos/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const [totals] = await db.select({
    totalPhotos: sql<number>`count(*) filter (where not ${photosTable.isTrashed} and not ${photosTable.isArchived})`,
    totalFavorited: sql<number>`count(*) filter (where ${photosTable.isFavorited} and not ${photosTable.isTrashed})`,
    totalArchived: sql<number>`count(*) filter (where ${photosTable.isArchived} and not ${photosTable.isTrashed})`,
    totalInTrash: sql<number>`count(*) filter (where ${photosTable.isTrashed})`,
    totalStorageBytes: sql<number>`coalesce(sum(${photosTable.fileSize}), 0)`,
  }).from(photosTable).where(eq(photosTable.userId, userId));

  const totalAlbumsRow = await db.select({ count: sql<number>`count(*)` })
    .from(albumsTable).where(eq(albumsTable.userId, userId));

  const recentRaw = await db.select().from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, false)))
    .orderBy(desc(photosTable.createdAt)).limit(8);
  const recentIds = recentRaw.map(p => p.id);
  const recentUploads = await enrichPhotos(recentIds, userId);

  const uploadsByMonth = await db.select({
    month: sql<string>`to_char(${photosTable.createdAt}, 'YYYY-MM')`,
    count: sql<number>`count(*)`,
  }).from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, false)))
    .groupBy(sql`to_char(${photosTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${photosTable.createdAt}, 'YYYY-MM')`);

  res.json({
    totalPhotos: Number(totals.totalPhotos),
    totalFavorited: Number(totals.totalFavorited),
    totalArchived: Number(totals.totalArchived),
    totalInTrash: Number(totals.totalInTrash),
    totalStorageBytes: Number(totals.totalStorageBytes),
    totalAlbums: Number(totalAlbumsRow[0]?.count ?? 0),
    recentUploads: recentIds.map(id => recentUploads.find(p => p.id === id)).filter(Boolean),
    uploadsByMonth: uploadsByMonth.map(r => ({ month: r.month, count: Number(r.count) })),
  });
});

router.get("/photos/timeline", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = GetPhotoTimelineQueryParams.safeParse(req.query);
  const page = parsed.success ? parsed.data.page ?? 1 : 1;
  const limit = parsed.success ? parsed.data.limit ?? 100 : 100;
  const offset = (page - 1) * limit;

  const photos = await db.select().from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, false), eq(photosTable.isArchived, false)))
    .orderBy(desc(photosTable.createdAt))
    .limit(limit).offset(offset);

  const [countRow] = await db.select({ count: sql<number>`count(*)` })
    .from(photosTable)
    .where(and(eq(photosTable.userId, userId), eq(photosTable.isTrashed, false), eq(photosTable.isArchived, false)));

  const enriched = await enrichPhotos(photos.map(p => p.id), userId);

  // Group by date
  const grouped: Record<string, typeof enriched> = {};
  for (const photo of photos) {
    const date = photo.createdAt.toISOString().slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    const rich = enriched.find(e => e.id === photo.id);
    if (rich) grouped[date].push(rich);
  }

  const groups = Object.entries(grouped).map(([date, photos]) => ({ date, photos }));
  res.json({ groups, total: Number(countRow.count) });
});

router.get("/photos", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = ListPhotosQueryParams.safeParse(req.query);
  const page = parsed.success ? parsed.data.page ?? 1 : 1;
  const limit = parsed.success ? parsed.data.limit ?? 50 : 50;
  const archived = parsed.success ? parsed.data.archived : undefined;
  const favorited = parsed.success ? parsed.data.favorited : undefined;
  const albumId = parsed.success ? parsed.data.albumId : undefined;
  const offset = (page - 1) * limit;

  const conditions = [eq(photosTable.userId, userId), eq(photosTable.isTrashed, false)];
  if (archived !== undefined) conditions.push(eq(photosTable.isArchived, archived));
  else conditions.push(eq(photosTable.isArchived, false));
  if (favorited !== undefined) conditions.push(eq(photosTable.isFavorited, favorited));

  let photoRows;
  let total: number;
  if (albumId) {
    const albumPhotoIds = await db.select({ photoId: albumPhotosTable.photoId })
      .from(albumPhotosTable).where(eq(albumPhotosTable.albumId, albumId));
    const ids = albumPhotoIds.map(r => r.photoId);
    if (ids.length === 0) { res.json({ photos: [], total: 0, page, limit }); return; }
    photoRows = await db.select().from(photosTable)
      .where(and(...conditions, inArray(photosTable.id, ids)))
      .orderBy(desc(photosTable.createdAt)).limit(limit).offset(offset);
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(photosTable)
      .where(and(...conditions, inArray(photosTable.id, ids)));
    total = Number(countRow.count);
  } else {
    photoRows = await db.select().from(photosTable)
      .where(and(...conditions)).orderBy(desc(photosTable.createdAt)).limit(limit).offset(offset);
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(photosTable)
      .where(and(...conditions));
    total = Number(countRow.count);
  }

  const enriched = await enrichPhotos(photoRows.map(p => p.id), userId);
  res.json({ photos: photoRows.map(p => enriched.find(e => e.id === p.id)).filter(Boolean), total, page, limit });
});

router.post("/photos", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = CreatePhotoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [photo] = await db.insert(photosTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json({ ...photo, tags: [], albums: [] });
});

router.get("/photos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = GetPhotoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const photo = await enrichPhoto(params.data.id, userId);
  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(photo);
});

router.patch("/photos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = UpdatePhotoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePhotoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(photosTable)
    .set(parsed.data)
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Photo not found" }); return; }
  const photo = await enrichPhoto(updated.id, userId);
  res.json(photo);
});

router.delete("/photos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = DeletePhotoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [updated] = await db.update(photosTable)
    .set({ isTrashed: true, trashedAt: new Date() })
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Photo not found" }); return; }
  res.sendStatus(204);
});

router.post("/photos/:id/tags", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = AddPhotoTagParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AddPhotoTagBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const photo = await db.select().from(photosTable)
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId))).then(r => r[0]);
  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  await db.insert(photoTagsTable).values({ photoId: params.data.id, tag: parsed.data.tag }).onConflictDoNothing();
  const enriched = await enrichPhoto(params.data.id, userId);
  res.json(enriched);
});

router.delete("/photos/:id/tags/:tag", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = RemovePhotoTagParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const photo = await db.select().from(photosTable)
    .where(and(eq(photosTable.id, params.data.id), eq(photosTable.userId, userId))).then(r => r[0]);
  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  await db.delete(photoTagsTable)
    .where(and(eq(photoTagsTable.photoId, params.data.id), eq(photoTagsTable.tag, params.data.tag)));
  const enriched = await enrichPhoto(params.data.id, userId);
  res.json(enriched);
});

export default router;
