import { Router } from "express";

import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

/** GET /users/:id — public profile */
usersRouter.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        image: true,
        upiId: true,
        karma: true,
        isGuest: true,
        createdAt: true,
        _count: {
          select: {
            doubts: true,
            paymentsReceived: { where: { status: "paid" } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Total earned
    const earnings = await prisma.payment.aggregate({
      where: { toUserId: user.id, status: "paid" },
      _sum: { helperAmount: true },
    });

    res.json({
      id: user.id,
      name: user.name,
      image: user.image,
      upiId: user.upiId,
      karma: user.karma,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
      doubtsPosted: user._count.doubts,
      tipsReceived: user._count.paymentsReceived,
      totalEarned: earnings._sum.helperAmount ?? 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/** PATCH /users/:id — update profile (upiId, name) */
usersRouter.patch("/:id", async (req, res) => {
  try {
    const { upiId, name } = req.body ?? {};

    const data: Record<string, string> = {};
    if (typeof upiId === "string") data.upiId = upiId.trim().slice(0, 100);
    if (typeof name === "string" && name.trim().length >= 2)
      data.name = name.trim().slice(0, 50);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, upiId: true },
    });

    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
