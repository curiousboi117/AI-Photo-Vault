import { Router, type IRouter } from "express";
import { and, eq, desc, ilike, or, gte, lte, inArray, sql } from "drizzle-orm";
import { db, photosTable, photoTagsTable, albumPhotosTable, albumsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { SearchPhotosQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search/photos", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = SearchPhotosQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { q, tag, dateFrom, dateTo, albumId, page = 1, limit = 50 } = parsed.data;
  const offset = (page - 1) * limit;

  let photoIds: number[] | null = null;

  // Filter by tag
  if (tag) {
    const tagRows = await db.select({ photoId: photoTagsTable.photoId })
      .from(photoTagsTable).where(eq(photoTagsTable.tag, tag));
    photoIds = tagRows.map(r => r.photoId);
    if (photoIds.length === 0) { res.json({ photos: [], total: 0, page, limit }); return; }
  }

  // Filter by album
  if (albumId) {
    const albumRows = await db.select({ photoId: albumPhotosTable.photoId })
      .from(albumPhotosTable).where(eq(albumPhotosTable.albumId, albumId));
    const albumPhotoIds = albumRows.map(r => r.photoId);
    photoIds = photoIds ? photoIds.filter(id => albumPhotoIds.includes(id)) : albumPhotoIds;
    if (photoIds.length === 0) { res.json({ photos: [], total: 0, page, limit }); return; }
  }

  // Also search by tag text in q
  if (q) {
    const tagSearch = await db.select({ photoId: photoTagsTable.photoId })
      .from(photoTagsTable).where(ilike(photoTagsTable.tag, `%${q}%`));
    const tagMatchIds = tagSearch.map(r => r.photoId);

    const conditions = [
      eq(photosTable.userId, userId),
      eq(photosTable.isTrashed, false),
      or(
        ilike(photosTable.filename, `%${q}%`),
        tagMatchIds.length > 0 ? inArray(photosTable.id, tagMatchIds) : sql`false`,
      )!,
    ];
    if (photoIds) conditions.push(inArray(photosTable.id, photoIds));
    if (dateFrom) conditions.push(gte(photosTable.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(photosTable.createdAt, new Date(dateTo + "T23:59:59Z")));

    const photos = await db.select().from(photosTable)
      .where(and(...conditions)).orderBy(desc(photosTable.createdAt)).limit(limit).offset(offset);
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(photosTable)
      .where(and(...conditions));
    const tags = photos.length > 0
      ? await db.select().from(photoTagsTable).where(inArray(photoTagsTable.photoId, photos.map(p => p.id)))
      : [];
    const albumRows = photos.length > 0
      ? await db.select({ photoId: albumPhotosTable.photoId, id: albumsTable.id, name: albumsTable.name })
          .from(albumPhotosTable).innerJoin(albumsTable, eq(albumPhotosTable.albumId, albumsTable.id))
          .where(inArray(albumPhotosTable.photoId, photos.map(p => p.id)))
      : [];
    const enriched = photos.map(p => ({
      ...p,
      tags: tags.filter(t => t.photoId === p.id).map(t => t.tag),
      albums: albumRows.filter(a => a.photoId === p.id).map(a => ({ id: a.id, name: a.name })),
    }));
    res.json({ photos: enriched, total: Number(countRow.count), page, limit });
    return;
  }

  const conditions = [eq(photosTable.userId, userId), eq(photosTable.isTrashed, false)];
  if (photoIds) conditions.push(inArray(photosTable.id, photoIds));
  if (dateFrom) conditions.push(gte(photosTable.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(photosTable.createdAt, new Date(dateTo + "T23:59:59Z")));

  const photos = await db.select().from(photosTable)
    .where(and(...conditions)).orderBy(desc(photosTable.createdAt)).limit(limit).offset(offset);
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(photosTable)
    .where(and(...conditions));
  const tags = photos.length > 0
    ? await db.select().from(photoTagsTable).where(inArray(photoTagsTable.photoId, photos.map(p => p.id)))
    : [];
  const albumRows = photos.length > 0
    ? await db.select({ photoId: albumPhotosTable.photoId, id: albumsTable.id, name: albumsTable.name })
        .from(albumPhotosTable).innerJoin(albumsTable, eq(albumPhotosTable.albumId, albumsTable.id))
        .where(inArray(albumPhotosTable.photoId, photos.map(p => p.id)))
    : [];
  const enriched = photos.map(p => ({
    ...p,
    tags: tags.filter(t => t.photoId === p.id).map(t => t.tag),
    albums: albumRows.filter(a => a.photoId === p.id).map(a => ({ id: a.id, name: a.name })),
  }));
  res.json({ photos: enriched, total: Number(countRow.count), page, limit });
});

export default router;
