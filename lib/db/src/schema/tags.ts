import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const photoTagsTable = pgTable("photo_tags", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull(),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhotoTag = typeof photoTagsTable.$inferSelect;
