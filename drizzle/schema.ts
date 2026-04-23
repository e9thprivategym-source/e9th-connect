import { pgEnum, pgTable, text, timestamp, varchar, integer, decimal, date, json, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const userRoleEnum = pgEnum("user_role", ["customer", "trainer", "admin"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const dietModeEnum = pgEnum("diet_mode", ["通常", "バルクアップ", "ケトジェニック"]);
export const mealTimeCategoryEnum = pgEnum("meal_time_category", ["朝食", "昼食", "夕食", "間食"]);
export const rewardTypeEnum = pgEnum("reward_type", ["point", "badge"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("customer").notNull(),
  /** LINE ユーザーID（LINE ログイン時に使用） */
  line_user_id: varchar("line_user_id", { length: 255 }).unique(),
  /** 顧客に割り当てられたトレーナーのID（顧客のみ使用） */
  assigned_trainer_id: integer("assigned_trainer_id"),
  // 身体情報
  height: decimal("height", { precision: 5, scale: 2 }), // cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // kg
  body_fat_percentage: decimal("body_fat_percentage", { precision: 5, scale: 2 }), // %
  age: integer("age"),
  gender: genderEnum("gender"),
  activity_level: decimal("activity_level", { precision: 3, scale: 2 }), // 1.2 ~ 1.9
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 食事ログテーブル
 */
export const meals = pgTable("meals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull(),
  meal_date: date("meal_date").notNull(),
  meal_time_category: mealTimeCategoryEnum("meal_time_category").notNull(),
  food_items_json: json("food_items_json").notNull(),
  total_calories: decimal("total_calories", { precision: 10, scale: 2 }).notNull(),
  total_pfc_json: json("total_pfc_json").notNull(),
  micronutrients_json: json("micronutrients_json"),
  image_url: varchar("image_url", { length: 2048 }),
  ai_feedback: text("ai_feedback"),
  trainer_comment: text("trainer_comment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

/**
 * トレーニング履歴テーブル
 */
export const trainings = pgTable("trainings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull(),
  training_date: date("training_date").notNull(),
  training_type: varchar("training_type", { length: 255 }),
  duration_minutes: integer("duration_minutes"),
  calories_burned: decimal("calories_burned", { precision: 10, scale: 2 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

/**
 * ユーザー設定・目標テーブル
 */
export const user_settings = pgTable("user_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull().unique(),
  target_calories: decimal("target_calories", { precision: 10, scale: 2 }),
  target_pfc_json: json("target_pfc_json"),
  dynamic_macro_enabled: boolean("dynamic_macro_enabled").default(false),
  high_carb_macro_json: json("high_carb_macro_json"),
  low_carb_macro_json: json("low_carb_macro_json"),
  diet_mode: dietModeEnum("diet_mode").default("通常").notNull(),
  sleep_sync_enabled: boolean("sleep_sync_enabled").default(false),
  steps_sync_enabled: boolean("steps_sync_enabled").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type UserSetting = typeof user_settings.$inferSelect;
export type InsertUserSetting = typeof user_settings.$inferInsert;

/**
 * 報酬テーブル
 */
export const rewards = pgTable("rewards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull(),
  reward_type: rewardTypeEnum("reward_type").notNull(),
  description: text("description").notNull(),
  points: integer("points").default(0),
  awarded_at: timestamp("awarded_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * 通知テーブル
 */
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipient_user_id: integer("recipient_user_id").notNull(),
  sender_user_id: integer("sender_user_id"),
  notification_type: varchar("notification_type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  related_entity_type: varchar("related_entity_type", { length: 64 }),
  related_entity_id: integer("related_entity_id"),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * 体調ログテーブル
 */
export const healthLogs = pgTable("health_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull(),
  log_date: varchar("log_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  fatigue_level: varchar("fatigue_level", { length: 20 }).notNull(), // Good, Normal, Bad
  swelling_status: boolean("swelling_status"),
  sleep_hours: decimal("sleep_hours", { precision: 3, scale: 1 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type HealthLog = typeof healthLogs.$inferSelect;
export type InsertHealthLog = typeof healthLogs.$inferInsert;

/**
 * コンディショニング・タスクテーブル
 */
export const conditioningTasks = pgTable("conditioning_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull(),
  trainer_id: integer("trainer_id").notNull(),
  task_description: text("task_description").notNull(),
  video_url: varchar("video_url", { length: 2048 }),
  due_date: varchar("due_date", { length: 10 }), // YYYY-MM-DD format
  is_completed: boolean("is_completed").default(false).notNull(),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type ConditioningTask = typeof conditioningTasks.$inferSelect;
export type InsertConditioningTask = typeof conditioningTasks.$inferInsert;