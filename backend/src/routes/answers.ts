import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const answersRouter = Router();

/**
 * POST /answers — post a structured shortcut answer.
 * Body: { doubtId, authorId, approachName?, oneLinerTrick?, quickSolution, detailedExplanation?, solveTime?, examTags? }
 */
answersRouter.post("/", async (req, res) => {
  try {
    const { doubtId, authorId, approachName, oneLinerTrick, quickSolution, detailedExplanation, solveTime, examTags } = req.body ?? {};

    if (!doubtId || !authorId || !quickSolution?.trim()) {
      res.status(400).json({ error: "doubtId, authorId, and quickSolution required" });
      return;
    }

    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } });
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }

    const answer = await prisma.answer.create({
      data: {
        doubtId,
        authorId,
        approachName: approachName?.trim().slice(0, 100) ?? null,
        oneLinerTrick: oneLinerTrick?.trim().slice(0, 300) ?? null,
        quickSolution: quickSolution.trim(),
        detailedExplanation: detailedExplanation?.trim() ?? null,
        solveTime: solveTime?.trim().slice(0, 20) ?? null,
        examTags: examTags?.trim().slice(0, 300) ?? null,
      },
      include: { author: { select: { id: true, name: true, image: true, karma: true, isVerified: true } } },
    });

    // Award karma for answering
    await prisma.user.update({
      where: { id: authorId },
      data: { karma: { increment: 2 } },
    });

    res.status(201).json(formatAnswer(answer, null));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to post answer" });
  }
});

/** GET /answers?doubtId=&userId= — answers for a doubt, sorted by rating */
answersRouter.get("/", async (req, res) => {
  try {
    const doubtId = req.query.doubtId as string;
    const userId = req.query.userId as string | undefined;
    if (!doubtId) { res.status(400).json({ error: "doubtId required" }); return; }

    const answers = await prisma.answer.findMany({
      where: { doubtId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true, karma: true, isVerified: true } },
        votes: true,
        ratings: true,
      },
    });

    res.json({
      answers: answers.map((a) => formatAnswer(a, userId ?? null)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

/**
 * GET /answers/tricks?exam=&subject=&q= — searchable trick library
 * Returns top-rated answers (4+ stars) as reusable tricks.
 */
answersRouter.get("/tricks", async (req, res) => {
  try {
    const exam = req.query.exam as string | undefined;
    const subject = req.query.subject as string | undefined;
    const q = (req.query.q as string | undefined)?.trim().toLowerCase();
    const take = Math.min(Number(req.query.take) || 30, 50);

    // Find answers with avg rating >= 4
    const answers = await prisma.answer.findMany({
      where: {
        approachName: { not: null },
        ratings: { some: {} },
        doubt: {
          ...(exam ? { exam } : {}),
          ...(subject ? { subject } : {}),
        },
        ...(q ? {
          OR: [
            { approachName: { contains: q } },
            { oneLinerTrick: { contains: q } },
            { quickSolution: { contains: q } },
            { examTags: { contains: q } },
          ],
        } : {}),
      },
      include: {
        author: { select: { id: true, name: true, karma: true, isVerified: true } },
        ratings: true,
        doubt: { select: { id: true, title: true, exam: true, subject: true } },
      },
      take: take * 2, // fetch more, then filter by rating
    });

    // Filter to 4+ star avg and sort
    const tricks = answers
      .map((a) => {
        const avg = a.ratings.length > 0
          ? a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length
          : 0;
        return { answer: a, avgRating: avg, ratingCount: a.ratings.length };
      })
      .filter((t) => t.avgRating >= 4)
      .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)
      .slice(0, take);

    res.json({
      tricks: tricks.map((t) => ({
        id: t.answer.id,
        approachName: t.answer.approachName,
        oneLinerTrick: t.answer.oneLinerTrick,
        quickSolution: t.answer.quickSolution,
        solveTime: t.answer.solveTime,
        examTags: t.answer.examTags,
        rating: t.avgRating,
        ratingCount: t.ratingCount,
        authorName: t.answer.author.name,
        authorKarma: t.answer.author.karma,
        authorVerified: t.answer.author.isVerified,
        doubt: t.answer.doubt,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch tricks" });
  }
});

/** POST /answers/:id/vote */
answersRouter.post("/:id/vote", async (req, res) => {
  try {
    const answerId = req.params.id;
    const { userId, value } = req.body ?? {};
    if (!userId || value === undefined) {
      res.status(400).json({ error: "userId and value required" });
      return;
    }
    const v = Number(value);
    if (v === 0) {
      await prisma.answerVote.deleteMany({ where: { answerId, userId } });
    } else {
      await prisma.answerVote.upsert({
        where: { answerId_userId: { answerId, userId } },
        create: { answerId, userId, value: v > 0 ? 1 : -1 },
        update: { value: v > 0 ? 1 : -1 },
      });
    }
    const votes = await prisma.answerVote.findMany({ where: { answerId } });
    res.json({
      upvotes: votes.filter((x) => x.value === 1).length,
      downvotes: votes.filter((x) => x.value === -1).length,
      userVote: v,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to vote" });
  }
});

/** POST /answers/:id/rate */
answersRouter.post("/:id/rate", async (req, res) => {
  try {
    const answerId = req.params.id;
    const { raterId, rating } = req.body ?? {};
    const r = Number(rating);
    if (!raterId || r < 1 || r > 5) {
      res.status(400).json({ error: "raterId and rating (1-5) required" });
      return;
    }
    await prisma.answerRating.upsert({
      where: { answerId_raterId: { answerId, raterId } },
      create: { answerId, raterId, rating: r },
      update: { rating: r },
    });
    if (r >= 4) {
      const answer = await prisma.answer.findUnique({ where: { id: answerId } });
      if (answer) {
        await prisma.user.update({
          where: { id: answer.authorId },
          data: { karma: { increment: r >= 5 ? 3 : 1 } },
        });
      }
    }
    const allRatings = await prisma.answerRating.findMany({ where: { answerId } });
    const avg = allRatings.reduce((s, x) => s + x.rating, 0) / allRatings.length;
    res.json({ rating: avg, count: allRatings.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to rate" });
  }
});

// --- Helper ---

function formatAnswer(a: any, userId: string | null) {
  const upvotes = (a.votes ?? []).filter((v: any) => v.value === 1).length;
  const downvotes = (a.votes ?? []).filter((v: any) => v.value === -1).length;
  const userVote = userId ? ((a.votes ?? []).find((v: any) => v.userId === userId)?.value ?? 0) : 0;
  const ratings = a.ratings ?? [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
    : null;

  return {
    id: a.id,
    doubtId: a.doubtId,
    authorId: a.authorId,
    authorName: a.author?.name,
    authorImage: a.author?.image,
    authorKarma: (a.author?.karma ?? 0) + 2,
    authorVerified: a.author?.isVerified ?? false,
    approachName: a.approachName,
    oneLinerTrick: a.oneLinerTrick,
    quickSolution: a.quickSolution,
    detailedExplanation: a.detailedExplanation,
    solveTime: a.solveTime,
    examTags: a.examTags,
    upvotes,
    downvotes,
    userVote,
    rating: avgRating,
    ratingCount: ratings.length,
    createdAt: a.createdAt.toISOString(),
  };
}
