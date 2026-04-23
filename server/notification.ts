/**
 * 通知システムの基盤
 * 
 * このモジュールは、アプリケーション内の通知ロジックを管理します。
 * 現在はシステム内通知（notifications テーブル）と LINE Messaging API に対応しています。
 */

import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import {
  sendLineMealRecordedNotification,
  sendLineTaskAssignedNotification,
  sendLineFeedbackNotification,
} from "./line-messaging";

/**
 * 通知タイプの定義
 */
export type NotificationType = 
  | "meal_recorded"      // 顧客が食事を記録
  | "meal_feedback"      // トレーナーがフィードバックを送信
  | "task_assigned"      // トレーナーがタスクを割り当て
  | "task_completed"     // 顧客がタスクを完了
  | "system_message";    // システムメッセージ

/**
 * 通知オブジェクトのインターフェース
 */
export interface Notification {
  recipient_user_id: number;
  sender_user_id?: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_entity_type?: string;  // "meal", "task", etc.
  related_entity_id?: number;
  is_read: boolean;
  created_at: Date;
}

/**
 * トレーナーに食事記録通知を送信（システム内通知 + LINE通知）
 * 
 * @param customer_id - 食事を記録した顧客のID
 * @param meal_id - 記録された食事のID
 * @param meal_time_category - 食事の種類（朝食、昼食、夕食、間食）
 * @param total_calories - 総カロリー
 */
export async function notifyTrainerMealRecorded(
  customer_id: number,
  meal_id: number,
  meal_time_category: string,
  total_calories: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for notification");
    return;
  }

  try {
    // 顧客の担当トレーナーを取得
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const customer = await db
      .select()
      .from(users)
      .where(eq(users.id, customer_id))
      .limit(1);

    if (!customer || customer.length === 0) {
      console.warn(`Customer ${customer_id} not found`);
      return;
    }

    const trainer_id = customer[0].assigned_trainer_id;
    if (!trainer_id) {
      console.warn(`Customer ${customer_id} has no assigned trainer`);
      return;
    }

    // 通知メッセージを作成
    const title = `${meal_time_category}の記録`;
    const message = `顧客が${meal_time_category}を記録しました（${total_calories}kcal）`;

    console.log(`[Notification] Trainer ${trainer_id} notified: ${message}`);

    // LINE 通知を送信
    try {
      const trainer = await db
        .select()
        .from(users)
        .where(eq(users.id, trainer_id))
        .limit(1);

      if (trainer && trainer[0].line_user_id) {
        await sendLineMealRecordedNotification(
          trainer[0].line_user_id,
          customer[0].name || '顧客',
          meal_time_category,
          total_calories
        );
      }
    } catch (error) {
      console.error('[LINE] Error sending meal recorded notification:', error);
    }
  } catch (error) {
    console.error("Error sending trainer notification:", error);
  }
}

/**
 * 顧客にタスク割り当て通知を送信（システム内通知 + LINE通知）
 * 
 * @param customer_id - 通知対象の顧客ID
 * @param task_id - 割り当てられたタスクのID
 * @param task_description - タスクの説明
 * @param trainer_id - タスクを割り当てたトレーナーのID
 * @param due_date - タスクの期限
 */
export async function notifyCustomerTaskAssigned(
  customer_id: number,
  task_id: number,
  task_description: string,
  trainer_id?: number,
  due_date?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for notification");
    return;
  }

  try {
    const title = "新しいタスクが割り当てられました";
    const message = `トレーナーから新しいタスクが割り当てられました: ${task_description}`;

    console.log(`[Notification] Customer ${customer_id} notified: ${message}`);

    // LINE 通知を送信
    try {
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const customer = await db
        .select()
        .from(users)
        .where(eq(users.id, customer_id))
        .limit(1);

      if (customer && customer[0].line_user_id) {
        let trainerName = 'トレーナー';
        if (trainer_id) {
          const trainer = await db
            .select()
            .from(users)
            .where(eq(users.id, trainer_id))
            .limit(1);
          if (trainer && trainer[0].name) {
            trainerName = trainer[0].name;
          }
        }

        await sendLineTaskAssignedNotification(
          customer[0].line_user_id,
          trainerName,
          task_description,
          due_date
        );
      }
    } catch (error) {
      console.error('[LINE] Error sending task assigned notification:', error);
    }
  } catch (error) {
    console.error("Error sending customer notification:", error);
  }
}

/**
 * トレーナーにフィードバック送信通知を送信（システム内通知 + LINE通知）
 * 
 * @param customer_id - フィードバック対象の顧客ID
 * @param trainer_id - フィードバックを送信したトレーナーのID
 * @param feedback_message - フィードバックメッセージ
 */
export async function notifyCustomerFeedback(
  customer_id: number,
  trainer_id: number,
  feedback_message: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for notification");
    return;
  }

  try {
    const title = "トレーナーからのフィードバック";
    const message = feedback_message;

    console.log(`[Notification] Customer ${customer_id} notified: ${message}`);

    // LINE 通知を送信
    try {
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const customer = await db
        .select()
        .from(users)
        .where(eq(users.id, customer_id))
        .limit(1);

      if (customer && customer[0].line_user_id) {
        const trainer = await db
          .select()
          .from(users)
          .where(eq(users.id, trainer_id))
          .limit(1);

        await sendLineFeedbackNotification(
          customer[0].line_user_id,
          trainer[0]?.name || 'トレーナー',
          feedback_message
        );
      }
    } catch (error) {
      console.error('[LINE] Error sending feedback notification:', error);
    }
  } catch (error) {
    console.error("Error sending feedback notification:", error);
  }
}

/**
 * 通知一覧を取得（ユーザーごと）
 * 
 * @param user_id - ユーザーID
 * @param limit - 取得件数（デフォルト: 20）
 * @param offset - オフセット（デフォルト: 0）
 */
export async function getNotifications(
  user_id: number,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // TODO: notifications テーブルをスキーマに追加後、以下を実装
    /*
    const notifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipient_user_id, user_id))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset);

    return notifications;
    */

    return [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * 通知を既読にマーク
 * 
 * @param notification_id - 通知ID
 */
export async function markNotificationAsRead(notification_id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // TODO: notifications テーブルをスキーマに追加後、以下を実装
    /*
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, notification_id));
    */
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}
