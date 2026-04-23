/**
 * コンディショニング・タスク機能のルーター
 * 
 * トレーナーが顧客に対してストレッチなどのタスクを割り当て、
 * 顧客がタスクを完了できる機能を提供します。
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { conditioningTasks, users } from "../../drizzle/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyCustomerTaskAssigned } from "../notification";

// Role-based procedures
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'customer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

const trainerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'trainer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Trainer access required' });
  }
  return next({ ctx });
});

export const conditioningRouter = router({
  /**
   * 顧客に割り当てられたタスク一覧を取得
   */
  getAssignedTasks: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const tasks = await db
        .select()
        .from(conditioningTasks)
        .where(eq(conditioningTasks.user_id, ctx.user!.id))
        .orderBy(desc(conditioningTasks.created_at));

      return tasks;
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch assigned tasks',
      });
    }
  }),

  /**
   * 未完了のタスク一覧を取得
   */
  getIncompleteTasks: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const tasks = await db
        .select()
        .from(conditioningTasks)
        .where(
          and(
            eq(conditioningTasks.user_id, ctx.user!.id),
            eq(conditioningTasks.is_completed, false)
          )
        )
        .orderBy(desc(conditioningTasks.due_date));

      return tasks;
    } catch (error) {
      console.error("Error fetching incomplete tasks:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch incomplete tasks',
      });
    }
  }),

  /**
   * タスクを完了にマーク
   */
  completeTask: customerProcedure.input(
    z.object({
      taskId: z.number(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // タスクがユーザーのものか確認
      const task = await db
        .select()
        .from(conditioningTasks)
        .where(
          and(
            eq(conditioningTasks.id, input.taskId),
            eq(conditioningTasks.user_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!task || task.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      await db
        .update(conditioningTasks)
        .set({
          is_completed: true,
          completed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(conditioningTasks.id, input.taskId));

      return { success: true };
    } catch (error) {
      console.error("Error completing task:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete task',
      });
    }
  }),

  /**
   * トレーナーが顧客にタスクを割り当て
   */
  assignTask: trainerProcedure.input(
    z.object({
      customer_id: z.number(),
      task_description: z.string(),
      video_url: z.string().optional(),
      due_date: z.string().optional(), // YYYY-MM-DD format
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
        .where(eq(users.id, input.customer_id))
        .limit(1);

      if (!customer || customer.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }

      // タスクを作成
      const result = await db.insert(conditioningTasks).values({
        user_id: input.customer_id,
        trainer_id: ctx.user!.id,
        task_description: input.task_description,
        video_url: input.video_url,
        due_date: input.due_date, // YYYY-MM-DD format
      }).returning();

      const taskId = result.length > 0 ? result[0].id : undefined;

      // 顧客に通知を送信
      if (taskId) {
        await notifyCustomerTaskAssigned(
          input.customer_id,
          taskId,
          input.task_description,
          ctx.user!.id,
          input.due_date
        );
      }

      return {
        success: true,
        taskId,
      };
    } catch (error) {
      console.error("Error assigning task:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign task',
      });
    }
  }),

  /**
   * トレーナーが顧客に割り当てたタスク一覧を取得
   */
  getCustomerTasks: trainerProcedure.input(
    z.object({
      customer_id: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      const tasks = await db
        .select()
        .from(conditioningTasks)
        .where(
          and(
            eq(conditioningTasks.user_id, input.customer_id),
            eq(conditioningTasks.trainer_id, ctx.user!.id)
          )
        )
        .orderBy(desc(conditioningTasks.created_at));

      return tasks;
    } catch (error) {
      console.error("Error fetching customer tasks:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customer tasks',
      });
    }
  }),

  /**
   * タスクを更新
   */
  updateTask: trainerProcedure.input(
    z.object({
      taskId: z.number(),
      task_description: z.string().optional(),
      video_url: z.string().optional(),
      due_date: z.string().optional(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // タスクがトレーナーのものか確認
      const task = await db
        .select()
        .from(conditioningTasks)
        .where(
          and(
            eq(conditioningTasks.id, input.taskId),
            eq(conditioningTasks.trainer_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!task || task.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      const updateData: any = {};
      if (input.task_description) updateData.task_description = input.task_description;
      if (input.video_url) updateData.video_url = input.video_url;
      if (input.due_date) updateData.due_date = input.due_date; // YYYY-MM-DD format
      updateData.updated_at = new Date();

      await db
        .update(conditioningTasks)
        .set(updateData)
        .where(eq(conditioningTasks.id, input.taskId));

      return { success: true };
    } catch (error) {
      console.error("Error updating task:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update task',
      });
    }
  }),

  /**
   * タスクを削除
   */
  deleteTask: trainerProcedure.input(
    z.object({
      taskId: z.number(),
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    }

    try {
      // タスクがトレーナーのものか確認
      const task = await db
        .select()
        .from(conditioningTasks)
        .where(
          and(
            eq(conditioningTasks.id, input.taskId),
            eq(conditioningTasks.trainer_id, ctx.user!.id)
          )
        )
        .limit(1);

      if (!task || task.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      await db.delete(conditioningTasks).where(eq(conditioningTasks.id, input.taskId));

      return { success: true };
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete task',
      });
    }
  }),
});
