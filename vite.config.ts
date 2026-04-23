import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// プロジェクトのルートディレクトリを取得
const PROJECT_ROOT = import.meta.dirname;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "client", "src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
      "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
    },
  },
  // フロントエンドのソースコードがあるディレクトリを指定
  root: path.resolve(PROJECT_ROOT, "client"),
  // 静的アセットのディレクトリを指定
  publicDir: path.resolve(PROJECT_ROOT, "client", "public"),
  build: {
    outDir: path.resolve(PROJECT_ROOT, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(PROJECT_ROOT, "client", "index.html"),
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
