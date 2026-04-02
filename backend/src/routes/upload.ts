import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const uploadRouter = Router();

const UPLOAD_DIR = path.resolve("uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/**
 * POST /upload — accepts raw image body with Content-Type header.
 * Returns { url } pointing to the static file.
 */
uploadRouter.post("/", (req, res) => {
  const contentType = req.headers["content-type"] ?? "";

  if (!ALLOWED_TYPES.has(contentType)) {
    res.status(400).json({ error: "Only JPEG, PNG, GIF, and WebP are allowed" });
    return;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  req.on("data", (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_SIZE) {
      res.status(413).json({ error: "File too large (max 5MB)" });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (res.headersSent) return;

    const buffer = Buffer.concat(chunks);
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    const url = `/uploads/${filename}`;
    res.status(201).json({ url });
  });

  req.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
});
