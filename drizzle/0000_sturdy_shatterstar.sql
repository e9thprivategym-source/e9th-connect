CREATE TYPE "public"."diet_mode" AS ENUM('通常', 'バルクアップ', 'ケトジェニック');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."meal_time_category" AS ENUM('朝食', '昼食', '夕食', '間食');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('point', 'badge');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'trainer', 'admin');--> statement-breakpoint
CREATE TABLE "chats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"meal_id" integer,
	"message_text" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"attachment_url" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditioning_tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conditioning_tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"trainer_id" integer NOT NULL,
	"task_description" text NOT NULL,
	"video_url" varchar(2048),
	"due_date" date,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "health_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"log_date" date NOT NULL,
	"fatigue_level" varchar(20) NOT NULL,
	"swelling_status" boolean,
	"sleep_hours" numeric(3, 1),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "meals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"meal_date" date NOT NULL,
	"meal_time_category" "meal_time_category" NOT NULL,
	"food_items_json" json NOT NULL,
	"total_calories" numeric(10, 2) NOT NULL,
	"total_pfc_json" json NOT NULL,
	"micronutrients_json" json,
	"image_url" varchar(2048),
	"ai_feedback" text,
	"trainer_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipient_user_id" integer NOT NULL,
	"sender_user_id" integer,
	"notification_type" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" varchar(64),
	"related_entity_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rewards_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"reward_type" "reward_type" NOT NULL,
	"description" text NOT NULL,
	"points" integer DEFAULT 0,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "trainings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"training_date" date NOT NULL,
	"training_type" varchar(255),
	"duration_minutes" integer,
	"calories_burned" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"target_calories" numeric(10, 2),
	"target_pfc_json" json,
	"dynamic_macro_enabled" boolean DEFAULT false,
	"high_carb_macro_json" json,
	"low_carb_macro_json" json,
	"diet_mode" "diet_mode" DEFAULT '通常' NOT NULL,
	"sleep_sync_enabled" boolean DEFAULT false,
	"steps_sync_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"assigned_trainer_id" integer,
	"height" numeric(5, 2),
	"weight" numeric(5, 2),
	"body_fat_percentage" numeric(5, 2),
	"age" integer,
	"gender" "gender",
	"activity_level" numeric(3, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
