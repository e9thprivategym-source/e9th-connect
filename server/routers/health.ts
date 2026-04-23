/**
 * 体調ログ機能のルーター
 * 
 * 顧客が毎日の体調（疲労度、むくみ、睡眠時間など）を記録できる機能を提供します。
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { healthLogs, users } from "../../drizzle/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Role-based procedure for customers
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'customer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

export const healthRouter = router({
  /**
   * 本日の体調ログを取得
   */
  getTodayHealthLog: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      const log = await db
        .select()
        .from(healthLogs)
        .where(
          and(
            eq(healthLogs.user_id, ctx.user!.id),
            eq(healthLogs.log_date, todayDate)
          )
        )
        .limit(1);

      return log[0] || null;
    } catch (error) {
      console.error("Error fetching today's health log:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch health log',
      });
    }
  }),

  /**
   * 指定期間の体調ログを取得
   */
  getHealthLogsByDateRange: customerProcedure.input(
    z.object({
      start_date: z.string(), // YYYY-MM-DD format
      end_date: z.string(),   // YYYY-MM-DD format
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const startDate = input.start_date; // YYYY-MM-DD format
      const endDateObj = new Date(input.end_date);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split('T')[0]; // YYYY-MM-DD format

      const logs = await db
        .select()
        .from(healthLogs)
        .where(
          and(
            eq(healthLogs.user_id, ctx.user!.id),
            gte(healthLogs.log_date, startDate),
            lt(healthLogs.log_date, endDate)
          )
        )
        .orderBy(desc(healthLogs.log_date));

      return logs;
    } catch (error) {
      console.error("Error fetching health logs by date range:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch health logs',
      });
    }
  }),

  /**
   * 体調ログを記録または更新
   */
  recordHealthLog: customerProcedure.input(
    z.object({
      log_date: z.string().optional(), // YYYY-MM-DD format, デフォルトは本日
      fatigue_level: z.enum(["Good", "Normal", "Bad"]).optional(),
      swelling_status: z.boolean().optional(),
      sleep_hours: z.number().optional(),
      notes: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const today = new Date();
      const logDate = input.log_date 
        ? input.log_date
        : today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // 既存のログを確認
      const existingLog = await db
        .select()
        .from(healthLogs)
        .where(
          and(
            eq(healthLogs.user_id, ctx.user!.id),
            eq(healthLogs.log_date, logDate)
          )
        )
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        // 既存のログを更新
        const updateData: any = {};
        if (input.fatigue_level) updateData.fatigue_level = input.fatigue_level;
        if (input.swelling_status !== undefined) updateData.swelling_status = input.swelling_status;
        if (input.sleep_hours !== undefined) updateData.sleep_hours = input.sleep_hours;
        if (input.notes) updateData.notes = input.notes;
        updateData.updated_at = new Date();

        await db
          .update(healthLogs)
          .set(updateData)
          .where(eq(healthLogs.id, existingLog[0].id));

        return {
          success: true,
          logId: existingLog[0].id,
          isNew: false,
        };
      } else {
        // 新しいログを作成
        const result = await db.insert(healthLogs).values({
          user_id: ctx.user!.id,
          log_date: logDate,
          fatigue_level: input.fatigue_level || "Normal",
          swelling_status: input.swelling_status,
          sleep_hours: input.sleep_hours ? input.sleep_hours.toString() : null,
          notes: input.notes,
        }).returning();

        return {
          success: true,
          logId: result.length > 0 ? result[0].id : undefined,
          isNew: true,
        };
      }
    } catch (error) {
      console.error("Error recording health log:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record health log',
      });
    }
  }),

  /**
   * 体調ログを削除
   */
  deleteHealthLog: customerProcedure.input(
    z.object({
      logId: z.number(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // ログがユーザーのものか確認
      const log = await db
        .select()
        .from(healthLogs)
        .where(
          and(
            eq(healthLogs.id, input.logId),
            eq(healthLogs.user_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!log || log.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Health log not found' });
      }

      await db.delete(healthLogs).where(eq(healthLogs.id, input.logId));

      return { success: true };
    } catch (error) {
      console.error("Error deleting health log:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete health log',
      });
    }
  }),
});
