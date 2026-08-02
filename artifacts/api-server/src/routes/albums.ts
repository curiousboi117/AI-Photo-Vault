import { Router, type IRouter } from "express";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import { db, albumsTable, albumPhotosTable, photosTable, photoTagsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import {
  CreateAlbumBody,
  UpdateAlbumBody,
  UpdateAlbumParams,
  GetAlbumParams,
  DeleteAlbumParams,
  AddPhotosToAlbumParams,
  AddPhotosToAlbumBody,
  RemovePhotoFromAlbumParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getAlbumWithPhotos(albumId: number, userId: string) {
  const album = await db.select().from(albumsTable)
    .where(and(eq(albumsTable.id, albumId), eq(albumsTable.userId, userId))).then(r => r[0]);
  if (!album) return null;

  const photoRows = await db.select({ photoId: albumPhotosTable.photoId })
    .from(albumPhotosTable).where(eq(albumPhotosTable.albumId, albumId));
  const photoIds = photoRows.map(r => r.photoId);

  let photos: any[] = [];
  if (photoIds.length > 0) {
    const photoList = await db.select().from(photosTable)
      .where(and(inArray(photosTable.id, photoIds), eq(photosTable.isTrashed, false)))
      .orderBy(desc(photosTable.createdAt));
    const tags = await db.select().from(photoTagsTable).where(inArray(photoTagsTable.photoId, photoIds));
    photos = photoList.map(p => ({
      ...p,
      tags: tags.filter(t => t.photoId === p.id).map(t => t.tag),
      albums: [{ id: album.id, name: album.name }],
    }));
  }

  const [countRow] = await db.select({ count: sql<number>`count(*)` })
    .from(albumPhotosTable).where(eq(albumPhotosTable.albumId, albumId));

  return { ...album, photos, photoCount: Number(countRow.count) };
}

async function getAlbumSummaries(userId: string) {
  const albums = await db.select().from(albumsTable)
    .where(eq(albumsTable.userId, userId)).orderBy(desc(albumsTable.updatedAt));
  const albumIds = albums.map(a => a.id);
  if (albumIds.length === 0) return [];

  const counts = await db.select({
    albumId: albumPhotosTable.albumId,
    count: sql<number>`count(*)`,
  }).from(albumPhotosTable).where(inArray(albumPhotosTable.albumId, albumIds))
    .groupBy(albumPhotosTable.albumId);

  return albums.map(a => ({
    ...a,
    photoCount: Number(counts.find(c => c.albumId === a.id)?.count ?? 0),
  }));
}

router.get("/albums", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const albums = await getAlbumSummaries(userId);
  res.json(albums);
});

router.post("/albums", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const parsed = CreateAlbumBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [album] = await db.insert(albumsTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json({ ...album, photoCount: 0 });
});

router.get("/albums/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = GetAlbumParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const album = await getAlbumWithPhotos(params.data.id, userId);
  if (!album) { res.status(404).json({ error: "Album not found" }); return; }
  res.json(album);
});

router.patch("/albums/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = UpdateAlbumParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAlbumBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(albumsTable)
    .set(parsed.data)
    .where(and(eq(albumsTable.id, params.data.id), eq(albumsTable.userId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Album not found" }); return; }
  const [countRow] = await db.select({ count: sql<number>`count(*)` })
    .from(albumPhotosTable).where(eq(albumPhotosTable.albumId, updated.id));
  res.json({ ...updated, photoCount: Number(countRow.count) });
});

router.delete("/albums/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = DeleteAlbumParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [deleted] = await db.delete(albumsTable)
    .where(and(eq(albumsTable.id, params.data.id), eq(albumsTable.userId, userId)))
    .returning();
  if (!deleted) { res.status(404).json({ error: "Album not found" }); return; }
  await db.delete(albumPhotosTable).where(eq(albumPhotosTable.albumId, params.data.id));
  res.sendStatus(204);
});

router.post("/albums/:id/photos", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = AddPhotosToAlbumParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AddPhotosToAlbumBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const album = await db.select().from(albumsTable)
    .where(and(eq(albumsTable.id, params.data.id), eq(albumsTable.userId, userId))).then(r => r[0]);
  if (!album) { res.status(404).json({ error: "Album not found" }); return; }
  for (const photoId of parsed.data.photoIds) {
    await db.insert(albumPhotosTable).values({ albumId: params.data.id, photoId }).onConflictDoNothing();
  }
  const detail = await getAlbumWithPhotos(params.data.id, userId);
  res.json(detail);
});

router.delete("/albums/:id/photos/:photoId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).clerkUserId as string;
  const params = RemovePhotoFromAlbumParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const album = await db.select().from(albumsTable)
    .where(and(eq(albumsTable.id, params.data.id), eq(albumsTable.userId, userId))).then(r => r[0]);
  if (!album) { res.status(404).json({ error: "Album not found" }); return; }
  await db.delete(albumPhotosTable)
    .where(and(eq(albumPhotosTable.albumId, params.data.id), eq(albumPhotosTable.photoId, params.data.photoId)));
  res.sendStatus(204);
});

export default router;
