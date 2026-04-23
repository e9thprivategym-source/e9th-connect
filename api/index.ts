/**
 * Vercel サーバーレス関数エントリポイント
 *
 * このファイルは Vercel 専用です。
 * ローカル開発時は server/_core/index.ts が使われます。
 */
import { app } from "../server/_core/app";

export default app;
