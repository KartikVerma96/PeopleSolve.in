import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { emitDoubtUpdate, emitToUser, emitToThread } from "../socket.js";

export const threadsRouter = Router();

/**
 * POST /threads — Create a thread (Help Now).
 * Body: { doubtId, helperId }
 * Automatically adds doubt author + helper as members.
 * Returns existing thread if helper already joined this doubt.
 */
threadsRouter.post("/", async (req, res) => {
  try {
    const { doubtId, helperId } = req.body ?? {};

    if (!doubtId || !helperId) {
      res.status(400).json({ error: "doubtId and helperId required" });
      return;
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      select: { id: true, authorId: true, title: true },
    });

    if (!doubt) {
      res.status(404).json({ error: "Doubt not found" });
      return;
    }

    if (doubt.authorId === helperId) {
      res.status(400).json({ error: "Cannot help your own doubt" });
      return;
    }

    // Check if this helper already has a thread for this doubt
    const existing = await prisma.thread.findFirst({
      where: {
        doubtId,
        members: { some: { userId: helperId, role: "helper" } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (existing) {
      res.json({
        thread: {
          id: existing.id,
          doubtId: existing.doubtId,
          doubtTitle: doubt.title,
          members: existing.members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            image: m.user.image,
            role: m.role,
          })),
          createdAt: existing.createdAt.toISOString(),
        },
        created: false,
      });
      return;
    }

    // Create thread with both members
    const thread = await prisma.thread.create({
      data: {
        doubtId,
        members: {
          create: [
            { userId: doubt.authorId, role: "author" },
            { userId: helperId, role: "helper" },
          ],
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    // Increment helper count on the doubt
    const updatedDoubt = await prisma.doubt.update({
      where: { id: doubtId },
      data: { helperCount: { increment: 1 } },
    });

    // Award karma to helper for offering help
    await prisma.user.update({
      where: { id: helperId },
      data: { karma: { increment: 1 } },
    });

    // Broadcast helper count update to feed
    emitDoubtUpdate(doubtId, { helperCount: updatedDoubt.helperCount });

    // Notify doubt author that someone is helping
    emitToUser(doubt.authorId, "thread:new", {
      threadId: thread.id,
      doubtTitle: doubt.title,
      helperName: thread.members.find((m) => m.userId === helperId)?.user.name,
    });

    res.status(201).json({
      thread: {
        id: thread.id,
        doubtId: thread.doubtId,
        doubtTitle: doubt.title,
        members: thread.members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
        })),
        createdAt: thread.createdAt.toISOString(),
      },
      created: true,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

/** GET /threads?userId= — list all threads for a user, with last message. */
threadsRouter.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }

    const threads = await prisma.thread.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: {
        doubt: { select: { id: true, title: true, exam: true, subject: true, resolved: true } },
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });

    res.json({
      threads: threads.map((t) => ({
        id: t.id,
        doubt: t.doubt,
        members: t.members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
        })),
        lastMessage: t.messages[0]
          ? {
              id: t.messages[0].id,
              body: t.messages[0].body,
              senderName: t.messages[0].sender.name,
              senderId: t.messages[0].senderId,
              createdAt: t.messages[0].createdAt.toISOString(),
            }
          : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

/** GET /threads/:id/messages — paginated messages for a thread. */
threadsRouter.get("/:id/messages", async (req, res) => {
  try {
    const threadId = req.params.id;
    const take = Math.min(Number(req.query.take) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const messages = await prisma.message.findMany({
      where: { threadId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;

    res.json({
      messages: items.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderImage: m.sender.image,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
      hasMore,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/** POST /threads/:id/messages — send a message. Body: { senderId, body } */
threadsRouter.post("/:id/messages", async (req, res) => {
  try {
    const threadId = req.params.id;
    const { senderId, body } = req.body ?? {};

    if (!senderId || !body?.trim()) {
      res.status(400).json({ error: "senderId and body required" });
      return;
    }

    // Verify sender is a member
    const member = await prisma.threadMember.findUnique({
      where: { threadId_userId: { threadId, userId: senderId } },
    });
    if (!member) {
      res.status(403).json({ error: "Not a member of this thread" });
      return;
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId,
        body: body.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Touch thread updatedAt for sort ordering
    await prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    const payload = {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderImage: message.sender.image,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    };

    // Broadcast to all clients in the thread room (for active chat)
    emitToThread(threadId, "message:new", payload);

    // Notify other thread members for badge (even if not in the chat room)
    const members = await prisma.threadMember.findMany({
      where: { threadId },
      select: { userId: true },
    });
    for (const m of members) {
      if (m.userId !== senderId) {
        emitToUser(m.userId, "message:notify", {
          threadId,
          senderName: message.sender.name,
          preview: message.body.slice(0, 80),
        });
      }
    }

    res.status(201).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});
