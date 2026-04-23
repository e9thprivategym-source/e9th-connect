import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, meals } from "../../drizzle/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Role-based procedure for trainers
const trainerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'trainer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Trainer access required' });
  }
  return next({ ctx });
});

export const trainerRouter = router({
  /**
   * 担当顧客一覧を取得
   */
  getAssignedCustomers: trainerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // トレーナーが担当する顧客を取得
      const customers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.assigned_trainer_id, ctx.user!.id),
            eq(users.role, 'customer')
          )
        );

      return customers;
    } catch (error) {
      console.error("Error fetching assigned customers:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customers',
      });
    }
  }),

  /**
   * 顧客の本日の進捗を取得
   */
  getCustomerTodayProgress: trainerProcedure.input(
    z.object({
      customerId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 権限確認：トレーナーが担当する顧客か確認
      const customer = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.customerId),
            eq(users.assigned_trainer_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!customer.length) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this customer' });
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const todayMeals = await db
        .select()
        .from(meals)
        .where(
          and(
            eq(meals.user_id, input.customerId),
            gte(meals.created_at, startOfDay),
            lt(meals.created_at, endOfDay)
          )
        );

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
        customerId: input.customerId,
        caloriesConsumed: totals.calories,
        caloriesTarget: 2200,
        proteinConsumed: totals.protein,
        proteinTarget: 180,
        fatConsumed: totals.fat,
        fatTarget: 70,
        carbsConsumed: totals.carbs,
        carbsTarget: 280,
        mealCount: todayMeals.length,
      };
    } catch (error) {
      console.error("Error fetching customer progress:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customer progress',
      });
    }
  }),

  /**
   * 顧客の週間達成率を取得
   */
  getWeeklyProgress: trainerProcedure.input(
    z.object({
      customerId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 権限確認
      const customer = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, input.customerId),
            eq(users.assigned_trainer_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!customer.length) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this customer' });
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weekMeals = await db
        .select()
        .from(meals)
        .where(
          and(
            eq(meals.user_id, input.customerId),
            gte(meals.created_at, weekAgo),
            lt(meals.created_at, now)
          )
        );

      const weekTotals = weekMeals.reduce(
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

      const weekTarget = {
        calories: 2200 * 7,
        protein: 180 * 7,
        fat: 70 * 7,
        carbs: 280 * 7,
      };

      return {
        customerId: input.customerId,
        achieved: {
          calories: weekTotals.calories,
          protein: weekTotals.protein,
          fat: weekTotals.fat,
          carbs: weekTotals.carbs,
        },
        target: weekTarget,
        achievementRate: {
          calories: (weekTotals.calories / weekTarget.calories) * 100,
          protein: (weekTotals.protein / weekTarget.protein) * 100,
          fat: (weekTotals.fat / weekTarget.fat) * 100,
          carbs: (weekTotals.carbs / weekTarget.carbs) * 100,
        },
      };
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch weekly progress',
      });
    }
  }),
});
