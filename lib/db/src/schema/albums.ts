import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const albumsTable = pgTable("albums", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name").notNull(),
  description: text("description"),
  coverObjectPath: text("cover_object_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const albumPhotosTable = pgTable("album_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull(),
  photoId: integer("photo_id").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlbumSchema = createInsertSchema(albumsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albumsTable.$inferSelect;
export type AlbumPhoto = typeof albumPhotosTable.$inferSelect;
