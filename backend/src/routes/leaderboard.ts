import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const leaderboardRouter = Router();

/** GET /leaderboard?exam=&period=week|month|all — top helpers by karma */
leaderboardRouter.get("/", async (req, res) => {
  try {
    const exam = req.query.exam as string | undefined;
    const period = (req.query.period as string) ?? "all";
    const take = Math.min(Number(req.query.take) || 20, 50);

    // For period-based, we'd need karma history — for now, use total karma
    // Filter by exam: users who have helped with doubts in that exam category
    let userIds: string[] | undefined;

    if (exam) {
      const threads = await prisma.thread.findMany({
        where: { doubt: { exam } },
        select: { members: { select: { userId: true }, where: { role: "helper" } } },
      });
      const ids = new Set<string>();
      threads.forEach((t) => t.members.forEach((m) => ids.add(m.userId)));
      userIds = [...ids];
    }

    const users = await prisma.user.findMany({
      where: {
        isGuest: false,
        ...(userIds ? { id: { in: userIds } } : {}),
      },
      orderBy: { karma: "desc" },
      take,
      select: {
        id: true,
        name: true,
        image: true,
        karma: true,
        isVerified: true,
        _count: {
          select: {
            answers: true,
            paymentsReceived: { where: { status: "paid" } },
          },
        },
      },
    });

    res.json({
      leaders: users.map((u, i) => ({
        rank: i + 1,
        id: u.id,
        name: u.name,
        image: u.image,
        karma: u.karma,
        isVerified: u.isVerified,
        answersCount: u._count.answers,
        tipsReceived: u._count.paymentsReceived,
      })),
      exam: exam ?? null,
      period,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
