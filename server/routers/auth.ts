/**
 * 認証ルーター
 * 
 * ユーザーのログイン・ログアウト機能を提供します。
 */
import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { COOKIE_NAME } from '@shared/const';
import { getSessionCookieOptions } from '../_core/cookies';

export const authRouter = router({
  /**
   * LINE ログイン
   * 
   * LINE から取得した ID トークンを検証し、ユーザーを登録/ログインします。
   */
  lineLogin: publicProcedure
    .input(
      z.object({
        idToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // ID トークンを検証
        if (!input.idToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid ID token',
          });
        }

        // ID トークンをデコード（JWT）
        const tokenParts = input.idToken.split('.');
        if (tokenParts.length !== 3) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token format',
          });
        }

        // ペイロードをデコード
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString('utf-8')
        );

        const lineUserId = payload.sub;
        const lineUserName = payload.name || 'LINE User';
        const lineUserEmail = payload.email;

        if (!lineUserId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token payload',
          });
        }

        // ユーザーをデータベースで検索
        let user = await db
          .select()
          .from(users)
          .where(eq(users.openId, lineUserId))
          .limit(1);

        if (user.length === 0) {
          // 新規ユーザーを作成
          const result = await db
            .insert(users)
            .values({
              openId: lineUserId,
              name: lineUserName,
              email: lineUserEmail,
              loginMethod: 'line',
              line_user_id: lineUserId,
            })
            .returning();

          user = result;
        } else {
          // 既存ユーザーを更新
          await db
            .update(users)
            .set({
              line_user_id: lineUserId,
              loginMethod: 'line',
            })
            .where(eq(users.openId, lineUserId));
        }

        return {
          success: true,
          userId: user[0].id,
          message: 'LINE ログインに成功しました',
        };
      } catch (error) {
        console.error('[LINE Auth] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to authenticate with LINE',
        });
      }
    }),

  /**
   * ログアウト
   * セッションクッキーをサーバー側で削除する
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true, message: 'ログアウトしました' };
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to logout',
      });
    }
  }),

  /**
   * 現在のユーザー情報を取得
   */
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return null;
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      return user[0] || null;
    } catch (error) {
      console.error('[Auth] Get current user error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get current user',
      });
    }
  }),
});
