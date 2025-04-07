import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar"),
  role: text("role").default("member"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatar: true,
  role: true,
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  description: true,
  createdBy: true,
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member"),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  teamId: true,
  userId: true,
  role: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teamId: integer("team_id").notNull(),
  color: text("color").default("#2563EB"),
  startDate: timestamp("start_date").notNull(),
  dueDate: timestamp("due_date"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  teamId: true,
  color: true,
  startDate: true,
  dueDate: true,
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  assigneeId: integer("assignee_id"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  tags: text("tags").array(),
  order: integer("order").notNull().default(0),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  projectId: true,
  assigneeId: true,
  status: true,
  priority: true,
  dueDate: true,
  tags: true,
  order: true,
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  taskId: true,
  userId: true,
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  url: true,
  size: true,
  type: true,
  projectId: true,
  taskId: true,
  uploadedBy: true,
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  teamId: true,
  userId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
