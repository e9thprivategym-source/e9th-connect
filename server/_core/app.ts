import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerUploadRoutes } from "../upload";
import { appRouter } from "../routers";
import { createContext } from "./context";

// Vercel / リバースプロキシ環境で req.protocol・req.ip を正しく解決するために必要
// これがないと SameSite=None + Secure=false の組み合わせでクッキーがサイレント拒否される
const REQUIRED_ENV_VARS = ["JWT_SECRET", "LINE_CHANNEL_ID", "LINE_CHANNEL_SECRET"] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[Startup] Missing required environment variable: ${key}`);
  }
}

// Express アプリを listen() なしでエクスポート
// ローカル開発は index.ts、Vercel デプロイは api/index.ts が使用する
export const app = express();

// Vercel / nginx 等のリバースプロキシ越しに req.protocol = "https" を正しく返すために必須
app.set("trust proxy", 1);

// ボディパーサー（ファイルアップロード用に上限を拡大）
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ルート登録
registerStorageProxy(app);
registerOAuthRoutes(app);
registerUploadRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);
