import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import axios from "axios";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    // LINE 側でユーザーがキャンセルした場合
    if (error) {
      console.warn("[OAuth] LINE auth denied by user:", error);
      res.redirect(302, `/?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state in callback");
      res.redirect(302, "/?error=missing_params");
      return;
    }

    // 必須環境変数の確認
    const channelId = process.env.LINE_CHANNEL_ID;
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelId || !channelSecret) {
      console.error("[OAuth] LINE_CHANNEL_ID or LINE_CHANNEL_SECRET is not set");
      res.redirect(302, "/?error=server_config");
      return;
    }

    try {
      const redirectUri = atob(state);

      // LINE のトークンエンドポイントで認可コードをアクセストークンに交換
      const tokenRes = await axios.post(
        "https://api.line.me/oauth2/v2.1/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: channelId,
          client_secret: channelSecret,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // LINE プロフィール API でユーザー情報を取得
      const profileRes = await axios.get("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });

      const { userId: openId, displayName: name } = profileRes.data;

      if (!openId) {
        console.error("[OAuth] LINE profile did not return userId");
        res.redirect(302, "/?error=no_user_id");
        return;
      }

      // DB にユーザーを登録（既存ユーザーは更新）
      await db.upsertUser({
        openId,
        name: name || null,
        email: null,
        loginMethod: "line",
        line_user_id: openId,
        lastSignedIn: new Date(),
      });

      // JWT セッショントークンを発行してクッキーにセット
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (err) {
      // axios エラーの詳細をログに残す
      if (axios.isAxiosError(err)) {
        console.error(
          "[OAuth] LINE API error:",
          err.response?.status,
          JSON.stringify(err.response?.data)
        );
      } else {
        console.error("[OAuth] LINE callback failed", err);
      }
      res.redirect(302, "/?error=oauth_failed");
    }
  });
}
