import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const challengesRouter = Router();

/** GET /challenges/today?exam= — today's challenge for an exam */
challengesRouter.get("/today", async (req, res) => {
  try {
    const exam = req.query.exam as string | undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      publishDate: { gte: today, lt: tomorrow },
    };
    if (exam) where.exam = exam;

    const challenges = await prisma.dailyChallenge.findMany({
      where,
      orderBy: { exam: "asc" },
    });

    res.json({
      date: today.toISOString().split("T")[0],
      challenges: challenges.map((c) => ({
        id: c.id,
        exam: c.exam,
        subject: c.subject,
        title: c.title,
        description: c.description,
        // Only reveal answer after the day is over
        answer: new Date() >= tomorrow ? c.answer : null,
        publishDate: c.publishDate.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

/** POST /challenges — create a challenge (admin). Body: { exam, subject, title, description, answer?, publishDate } */
challengesRouter.post("/", async (req, res) => {
  try {
    const { exam, subject, title, description, answer, publishDate } = req.body ?? {};

    if (!exam || !subject || !title || !description || !publishDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const challenge = await prisma.dailyChallenge.create({
      data: {
        exam,
        subject,
        title: title.slice(0, 200),
        description,
        answer: answer ?? null,
        publishDate: new Date(publishDate),
      },
    });

    res.status(201).json(challenge);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});
