import { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({ storage: multer.memoryStorage() });

/**
 * 食事画像アップロードエンドポイント
 * POST /api/upload-meal-image
 */
export function registerUploadRoutes(app: Express) {
  app.post("/api/upload-meal-image", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "ファイルが見つかりません" });
      }

      const mealCategory = req.body.mealCategory || "食事";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `meal-${mealCategory}-${timestamp}`;

      // S3にアップロード
      const { url } = await storagePut(
        `meals/${filename}`,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        imageUrl: url,
        filename,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "アップロードに失敗しました" });
    }
  });
}
