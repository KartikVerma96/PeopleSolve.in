import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";

import { prisma } from "../lib/prisma.js";

export const paymentsRouter = Router();

const PLATFORM_FEE_PERCENT = 10;

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * POST /payments/create-order
 * Body: { fromUserId, toUserId, threadId?, amountInr, note? }
 * amountInr is in rupees (e.g. 50 for ₹50)
 */
paymentsRouter.post("/create-order", async (req, res) => {
  try {
    const { fromUserId, toUserId, threadId, amountInr, note } = req.body ?? {};

    if (!fromUserId || !toUserId || !amountInr) {
      res.status(400).json({ error: "fromUserId, toUserId, and amountInr required" });
      return;
    }

    if (fromUserId === toUserId) {
      res.status(400).json({ error: "Cannot tip yourself" });
      return;
    }

    const amount = Math.round(Number(amountInr));
    if (amount < 1 || amount > 10000) {
      res.status(400).json({ error: "Amount must be between ₹1 and ₹10,000" });
      return;
    }

    const amountPaise = amount * 100;
    const platformFee = Math.round(amountPaise * PLATFORM_FEE_PERCENT / 100);
    const helperAmount = amountPaise - platformFee;

    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId }, select: { id: true, name: true } }),
      prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, name: true } }),
    ]);

    if (!fromUser || !toUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      notes: {
        fromUserId,
        toUserId,
        threadId: threadId ?? "",
        platformFee: String(platformFee),
        helperAmount: String(helperAmount),
      },
    });

    // Store in DB
    const payment = await prisma.payment.create({
      data: {
        fromUserId,
        toUserId,
        threadId: threadId ?? null,
        amount: amountPaise,
        platformFee,
        helperAmount,
        status: "created",
        razorpayOrderId: order.id,
        note: note?.slice(0, 200) ?? null,
      },
    });

    res.status(201).json({
      paymentId: payment.id,
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      helperName: toUser.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("create-order error:", e);
    const msg = e instanceof Error ? e.message : "Failed to create order";
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /payments/verify
 * Body: { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature }
 */
paymentsRouter.post("/verify", async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body ?? {};

    if (!paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      res.status(400).json({ error: "Missing payment verification fields" });
      return;
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({ error: "Razorpay not configured" });
      return;
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      // Mark as failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "failed" },
      });
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    // Update payment as successful
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        razorpayPaymentId,
        razorpaySignature,
      },
      include: {
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
    });

    // Award karma to helper (1 karma per ₹10 tipped)
    const karmaBonus = Math.max(1, Math.floor(payment.amount / 1000));
    await prisma.user.update({
      where: { id: payment.toUserId },
      data: { karma: { increment: karmaBonus } },
    });

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        helperAmount: payment.helperAmount,
        platformFee: payment.platformFee,
        status: payment.status,
        fromName: payment.fromUser.name,
        toName: payment.toUser.name,
      },
    });
  } catch (e) {
    console.error("verify error:", e);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/** GET /payments/history?userId= — tip history for a user (sent + received) */
paymentsRouter.get("/history", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: "paid",
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    res.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        helperAmount: p.helperAmount,
        platformFee: p.platformFee,
        note: p.note,
        direction: p.fromUserId === userId ? "sent" : "received",
        otherUser: p.fromUserId === userId
          ? { id: p.toUser.id, name: p.toUser.name }
          : { id: p.fromUser.id, name: p.fromUser.name },
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});
