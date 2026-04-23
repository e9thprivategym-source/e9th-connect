import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { meals, users } from "../../drizzle/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyTrainerMealRecorded } from "../notification";

// Role-based procedure for customers
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'customer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

export const customerRouter = router({
  /**
   * 本日のPFC進捗を取得
   */
  getTodayProgress: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // 本日の食事ログを取得
    const todayMeals = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.user_id, ctx.user!.id),
          gte(meals.created_at, startOfDay),
          lt(meals.created_at, endOfDay)
        )
      );

    // 合計を計算
    const totals = todayMeals.reduce(
      (acc, meal) => {
        const calories = parseFloat(meal.total_calories?.toString() || '0');
        const pfc = meal.total_pfc_json as any || {};
        return {
          calories: acc.calories + calories,
          protein: acc.protein + (parseFloat(pfc.protein?.toString() || '0')),
          fat: acc.fat + (parseFloat(pfc.fat?.toString() || '0')),
          carbs: acc.carbs + (parseFloat(pfc.carbs?.toString() || '0')),
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    return {
      caloriesConsumed: totals.calories,
      caloriesTarget: 2200,
      proteinConsumed: totals.protein,
      proteinTarget: 180,
      fatConsumed: totals.fat,
      fatTarget: 70,
      carbsConsumed: totals.carbs,
      carbsTarget: 280,
    };
  }),

  /**
   * 本日の食事一覧を取得
   */
  getTodayMeals: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todayMeals = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.user_id, ctx.user!.id),
          gte(meals.created_at, startOfDay),
          lt(meals.created_at, endOfDay)
        )
      );

    return todayMeals;
  }),

  /**
   * 食事を記録
   */
  recordMeal: customerProcedure.input(
    z.object({
      food_items: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
        })
      ),
      meal_time_category: z.enum(["朝食", "昼食", "夕食", "間食"]),
      total_calories: z.number(),
      protein: z.number(),
      fat: z.number(),
      carbs: z.number(),
      image_url: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const today = new Date();
      const mealDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      const result = await db.insert(meals).values({
        user_id: ctx.user!.id,
        meal_date: mealDate,
        meal_time_category: input.meal_time_category,
        food_items_json: input.food_items,
        total_calories: input.total_calories.toString(),
        total_pfc_json: {
          protein: input.protein,
          fat: input.fat,
          carbs: input.carbs,
        },
        image_url: input.image_url,
      }).returning();

      const mealId = result.length > 0 ? result[0].id : undefined;

      // 担当トレーナーに通知を送信
      if (mealId) {
        await notifyTrainerMealRecorded(
          ctx.user!.id,
          mealId,
          input.meal_time_category,
          input.total_calories
        );
      }

      return {
        success: true,
        mealId,
      };
    } catch (error) {
      console.error("Error recording meal:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record meal',
      });
    }
  }),

  /**
   * ユーザー設定を取得
   */
  getSettings: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    return user[0] || null;
  }),

  /**
   * ユーザー設定を更新
   */
  updateSettings: customerProcedure.input(
    z.object({
      diet_mode: z.enum(["通常", "バルクアップ", "ケトジェニック"]).optional(),
      daily_calorie_target: z.number().optional(),
      name: z.string().optional(),
      height: z.number().optional(),
      weight: z.number().optional(),
      body_fat_percentage: z.number().optional(),
      age: z.number().optional(),
      gender: z.enum(["male", "female"]).optional(),
      activity_level: z.number().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.height) updateData.height = input.height;
      if (input.weight) updateData.weight = input.weight;
      if (input.body_fat_percentage !== undefined) updateData.body_fat_percentage = input.body_fat_percentage;
      if (input.age) updateData.age = input.age;
      if (input.gender) updateData.gender = input.gender;
      if (input.activity_level) updateData.activity_level = input.activity_level;
      if (input.diet_mode) updateData.diet_mode = input.diet_mode;
      if (input.daily_calorie_target) updateData.daily_calorie_target = input.daily_calorie_target;

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, ctx.user!.id));
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error updating settings:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update settings',
      });
    }
  }),

  /**
   * 報酬を取得
   */
  getRewards: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    return {
      points: 0,
      badges: [],
      rank: "ビギナー",
    };
  }),

  /**
   * 報酬を付与
   */
  awardReward: customerProcedure.input(
    z.object({
      points: z.number(),
      badge: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      return {
        success: true,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to award reward',
      });
    }
  }),

  /**
   * 食事を編集
   */
  updateMeal: customerProcedure.input(
    z.object({
      mealId: z.number(),
      food_items: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          unit: z.string(),
        })
      ).optional(),
      total_calories: z.number().optional(),
      protein: z.number().optional(),
      fat: z.number().optional(),
      carbs: z.number().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 食事がユーザーのものか確認
      const meal = await db
        .select()
        .from(meals)
        .where(and(eq(meals.id, input.mealId), eq(meals.user_id, ctx.user!.id)))
        .limit(1);

      if (!meal || meal.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal not found' });
      }

      const updateData: any = {};
      if (input.food_items) updateData.food_items_json = input.food_items;
      if (input.total_calories !== undefined) updateData.total_calories = input.total_calories.toString();
      if (input.protein !== undefined || input.fat !== undefined || input.carbs !== undefined) {
        updateData.total_pfc_json = {
          protein: input.protein ?? (meal[0].total_pfc_json as any)?.protein,
          fat: input.fat ?? (meal[0].total_pfc_json as any)?.fat,
          carbs: input.carbs ?? (meal[0].total_pfc_json as any)?.carbs,
        };
      }

      await db.update(meals).set(updateData).where(eq(meals.id, input.mealId));

      return { success: true };
    } catch (error) {
      console.error("Error updating meal:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update meal',
      });
    }
  }),

  /**
   * 食事を削除
   */
  deleteMeal: customerProcedure.input(
    z.object({
      mealId: z.number(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 食事がユーザーのものか確認
      const meal = await db
        .select()
        .from(meals)
        .where(and(eq(meals.id, input.mealId), eq(meals.user_id, ctx.user!.id)))
        .limit(1);

      if (!meal || meal.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Meal not found' });
      }

      await db.delete(meals).where(eq(meals.id, input.mealId));

      return { success: true };
    } catch (error) {
      console.error("Error deleting meal:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete meal',
      });
    }
  }),
});