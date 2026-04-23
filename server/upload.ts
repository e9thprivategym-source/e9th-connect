import type { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./_core/../storage";

const upload = multer({ storage: multer.memoryStorage() });

export function registerUploadRoutes(app: Express) {
  app.post(
    "/api/upload-meal-image",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "ファイルが見つかりません" });
          return;
        }

        const mealCategory = (req.body?.mealCategory as string) || "食事";
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `meal-${mealCategory}-${timestamp}`;

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
    }
  );
}
