import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, meals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generateInviteToken, generateInviteUrl } from "../inviteTokens";

// Role-based procedure for admins
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * すべてのトレーナーを取得
   */
  getAllTrainers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const trainers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'trainer'));

      return trainers;
    } catch (error) {
      console.error("Error fetching trainers:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trainers',
      });
    }
  }),

  /**
   * すべての顧客を取得
   */
  getAllCustomers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const customers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'customer'));

      return customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customers',
      });
    }
  }),

  /**
   * トレーナーに顧客を割り当て
   */
  assignCustomerToTrainer: adminProcedure.input(
    z.object({
      customerId: z.number(),
      trainerId: z.number(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 顧客が存在するか確認
      const customer = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.customerId), eq(users.role, 'customer')))
        .limit(1);

      if (!customer.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }

      // トレーナーが存在するか確認
      const trainer = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.trainerId), eq(users.role, 'trainer')))
        .limit(1);

      if (!trainer.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer not found' });
      }

      // 顧客にトレーナーを割り当て
      await db
        .update(users)
        .set({ assigned_trainer_id: input.trainerId })
        .where(eq(users.id, input.customerId));

      return {
        success: true,
        message: `顧客 ${customer[0].name} をトレーナー ${trainer[0].name} に割り当てました`,
      };
    } catch (error) {
      console.error("Error assigning customer:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign customer',
      });
    }
  }),

  /**
   * トレーナーの指導状況を監査
   */
  getTrainerAuditInfo: adminProcedure.input(
    z.object({
      trainerId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // トレーナーが存在するか確認
      const trainer = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.trainerId), eq(users.role, 'trainer')))
        .limit(1);

      if (!trainer.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer not found' });
      }

      // トレーナーが担当する顧客を取得
      const assignedCustomers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.assigned_trainer_id, input.trainerId),
            eq(users.role, 'customer')
          )
        );

      return {
        trainer: trainer[0],
        assignedCustomerCount: assignedCustomers.length,
        assignedCustomers,
        lastActivity: trainer[0].lastSignedIn,
      };
    } catch (error) {
      console.error("Error fetching trainer audit info:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trainer audit info',
      });
    }
  }),

  /**
   * 顧客のトレーナーを変更（引き継ぎ）
   */
  changeCustomerTrainer: adminProcedure.input(
    z.object({
      customerId: z.number(),
      newTrainerId: z.number(),
      reason: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // 顧客が存在するか確認
      const customer = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.customerId), eq(users.role, 'customer')))
        .limit(1);

      if (!customer.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }

      // 新しいトレーナーが存在するか確認
      const newTrainer = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.newTrainerId), eq(users.role, 'trainer')))
        .limit(1);

      if (!newTrainer.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'New trainer not found' });
      }

      // トレーナーを変更
      await db
        .update(users)
        .set({ assigned_trainer_id: input.newTrainerId })
        .where(eq(users.id, input.customerId));

      return {
        success: true,
        message: `顧客 ${customer[0].name} のトレーナーを変更しました`,
        reason: input.reason,
      };
    } catch (error) {
      console.error("Error changing customer trainer:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change customer trainer',
      });
    }
  }),

  /**
   * システム統計情報を取得
   */
  getSystemStats: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const allUsers = await db.select().from(users);
      const allMeals = await db.select().from(meals);

      const trainers = allUsers.filter((u) => u.role === 'trainer');
      const customers = allUsers.filter((u) => u.role === 'customer');

      return {
        totalUsers: allUsers.length,
        totalTrainers: trainers.length,
        totalCustomers: customers.length,
        totalMealRecords: allMeals.length,
        averageCustomersPerTrainer:
          trainers.length > 0
            ? Math.round(customers.length / trainers.length)
            : 0,
      };
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch system stats',
      });
    }
  }),

  generateTrainerInviteUrl: adminProcedure.input(
    z.object({
      trainerEmail: z.string().email(),
      trainerName: z.string(),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const token = generateInviteToken();
      const baseUrl = process.env.VITE_APP_URL || 'https://e9th-connect.manus.space';
      const inviteUrl = generateInviteUrl(token, baseUrl);

      return {
        success: true,
        inviteUrl,
        token,
        expiresIn: '7 days',
      };
    } catch (error) {
      console.error('Error generating trainer invite URL:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate trainer invite URL',
      });
    }
  }),
});
