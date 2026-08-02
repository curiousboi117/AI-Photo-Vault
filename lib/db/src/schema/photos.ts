import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  filename: text("filename").notNull(),
  objectPath: text("object_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width").notNull().default(0),
  height: integer("height").notNull().default(0),
  isFavorited: boolean("is_favorited").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  isTrashed: boolean("is_trashed").notNull().default(false),
  trashedAt: timestamp("trashed_at", { withTimezone: true }),
  caption: text("caption"),
  aiTags: text("ai_tags"), // JSON array stored as text
  exifData: text("exif_data"), // JSON object stored as text
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;
