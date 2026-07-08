import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const reportsRouter = Router();

/** POST /reports — file a report. Body: { reporterId, targetType, targetId, reason } */
reportsRouter.post("/", async (req, res) => {
  try {
    const { reporterId, targetType, targetId, reason } = req.body ?? {};

    if (!reporterId || !targetType || !targetId || !reason?.trim()) {
      res.status(400).json({ error: "All fields required" });
      return;
    }

    const validTypes = ["doubt", "answer", "message", "user"];
    if (!validTypes.includes(targetType)) {
      res.status(400).json({ error: "Invalid target type" });
      return;
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reason: reason.trim().slice(0, 500),
        status: "pending",
      },
    });

    res.status(201).json({ id: report.id, status: report.status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to file report" });
  }
});
