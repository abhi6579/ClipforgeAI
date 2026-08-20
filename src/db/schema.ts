import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  real,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // free | creator | studio
  credits: integer("credits").notNull().default(60),
  streak: integer("streak").notNull().default(1),
  bestStreak: integer("best_streak").notNull().default(1),
  lastSeenDate: text("last_seen_date").notNull().default(""),
  avatarHue: integer("avatar_hue").notNull().default(260),
  niche: text("niche").notNull().default("General"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type AnalysisPayload = {
  summary: string;
  vibe: string;
  score: number;
  retentionRisk: string;
  hooks: string[];
  suggestions: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  keywords: string[];
  bestPostTime: string;
  engine: string;
};

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    platform: text("platform").notNull().default("youtube"),
    sourceUrl: text("source_url").notNull().default(""),
    durationSec: integer("duration_sec").notNull().default(600),
    goal: text("goal").notNull().default("growth"),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("draft"), // draft | analyzing | ready | published
    analysis: jsonb("analysis").$type<AnalysisPayload | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_user_idx").on(t.userId)],
);

export const clips = pgTable(
  "clips",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    hook: text("hook").notNull().default(""),
    caption: text("caption").notNull().default(""),
    hashtags: text("hashtags").notNull().default(""),
    startSec: integer("start_sec").notNull().default(0),
    endSec: integer("end_sec").notNull().default(30),
    score: real("score").notNull().default(70),
    status: text("status").notNull().default("suggested"), // suggested | approved | exported
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clips_user_idx").on(t.userId), index("clips_project_idx").on(t.projectId)],
);

export const ideas = pgTable(
  "ideas",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    angle: text("angle").notNull().default(""),
    platform: text("platform").notNull().default("reels"),
    status: text("status").notNull().default("backlog"), // backlog | scripting | filming | posted
    scheduledFor: text("scheduled_for").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ideas_user_idx").on(t.userId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    kind: text("kind").notNull().default("daily"), // daily | quest | sponsor
    reward: integer("reward").notNull().default(10),
    done: boolean("done").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_user_idx").on(t.userId)],
);

export const creditEvents = pgTable(
  "credit_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    source: text("source").notNull().default("system"), // task | game | sponsor | ai | plan
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_events_user_idx").on(t.userId)],
);

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  headline: text("headline").notNull(),
  detail: text("detail").notNull(),
  reward: integer("reward").notNull().default(40),
  accent: text("accent").notNull().default("violet"),
  active: boolean("active").notNull().default(true),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type Idea = typeof ideas.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CreditEvent = typeof creditEvents.$inferSelect;
export type Offer = typeof offers.$inferSelect;
