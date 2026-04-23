/**
 * トレーナー招待URL機能
 * 管理者が生成した招待URLをトレーナーが使用してサインアップ
 */

import crypto from "crypto";

/**
 * 招待トークンを生成
 * @returns 32文字のランダムトークン
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * 招待トークンが有効か確認
 * @param createdAt トークン生成時刻（ISO 8601形式）
 * @param expiresInDays 有効期限（日数）
 * @returns 有効な場合true
 */
export function isInviteTokenValid(createdAt: Date, expiresInDays: number = 7): boolean {
  const now = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
  return now < expiresAt;
}

/**
 * 招待URLを生成
 * @param token 招待トークン
 * @param baseUrl アプリケーションのベースURL
 * @returns 招待URL
 */
export function generateInviteUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/trainer-signup?token=${token}`;
}
