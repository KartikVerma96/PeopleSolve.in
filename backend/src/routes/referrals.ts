import crypto from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const referralsRouter = Router();

const REFERRAL_KARMA_BONUS = 5;

/** POST /referrals/generate — generate a referral code for user. Body: { userId } */
referralsRouter.post("/generate", async (req, res) => {
  try {
    const { userId } = req.body ?? {};
    if (!userId) { res.status(400).json({ error: "userId required" }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    if (user.referralCode) {
      res.json({ code: user.referralCode });
      return;
    }

    // Generate unique 8-char code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });

    res.json({ code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate referral code" });
  }
});

/** POST /referrals/apply — apply a referral code during signup. Body: { userId, code } */
referralsRouter.post("/apply", async (req, res) => {
  try {
    const { userId, code } = req.body ?? {};
    if (!userId || !code) {
      res.status(400).json({ error: "userId and code required" });
      return;
    }

    // Find referrer
    const referrer = await prisma.user.findFirst({
      where: { referralCode: code.toUpperCase() },
    });
    if (!referrer) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }

    if (referrer.id === userId) {
      res.status(400).json({ error: "Cannot refer yourself" });
      return;
    }

    // Check if already referred
    const existing = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });
    if (existing) {
      res.status(409).json({ error: "Already used a referral code" });
      return;
    }

    // Create referral and award karma to both
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: userId,
        code: code.toUpperCase(),
        karmaAwarded: REFERRAL_KARMA_BONUS,
      },
    });

    await prisma.user.update({
      where: { id: referrer.id },
      data: { karma: { increment: REFERRAL_KARMA_BONUS } },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { karma: { increment: REFERRAL_KARMA_BONUS } },
    });

    res.json({
      success: true,
      karmaAwarded: REFERRAL_KARMA_BONUS,
      referrerName: referrer.name,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to apply referral" });
  }
});

/** GET /referrals/stats?userId= — referral stats for a user */
referralsRouter.get("/stats", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ error: "userId required" }); return; }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referredUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      code: user?.referralCode ?? null,
      totalReferred: referrals.length,
      totalKarmaEarned: referrals.length * REFERRAL_KARMA_BONUS,
      referrals: referrals.map((r) => ({
        name: r.referredUser.name,
        karmaAwarded: r.karmaAwarded,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch referral stats" });
  }
});
