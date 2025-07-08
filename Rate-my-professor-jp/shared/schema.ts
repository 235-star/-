import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  professorCount: integer("professor_count").notNull().default(0),
});

export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  universityId: integer("university_id").notNull(),
  overallRating: real("overall_rating").default(0),
  teachingQuality: real("teaching_quality").default(0),
  difficulty: real("difficulty").default(0),
  reviewCount: integer("review_count").default(0),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),
  course: text("course").notNull(),
  overallRating: integer("overall_rating").notNull(),
  teachingQuality: integer("teaching_quality").notNull(),
  difficulty: integer("difficulty").notNull(),
  grade: text("grade"),
  content: text("content"),
  authorName: text("author_name").default("匿名学生"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteStats = pgTable("site_stats", {
  id: serial("id").primaryKey(),
  accessCount: integer("access_count").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
  professorCount: true,
});

export const insertProfessorSchema = createInsertSchema(professors).omit({
  id: true,
  overallRating: true,
  teachingQuality: true,
  difficulty: true,
  reviewCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  overallRating: z.number().min(1).max(5),
  teachingQuality: z.number().min(1).max(5),
  difficulty: z.number().min(1).max(5),
  grade: z.string().optional(),
  content: z.string().optional(),
});

export type University = typeof universities.$inferSelect;
export type Professor = typeof professors.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type SiteStats = typeof siteStats.$inferSelect;
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
