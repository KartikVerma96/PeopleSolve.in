import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { emitNewDoubt, emitDoubtUpdate } from "../socket.js";

export const doubtsRouter = Router();

/** GET /doubts — paginated list, newest first. Optional ?exam=&subject=&q= filters. */
doubtsRouter.get("/", async (req, res) => {
  try {
    const take = Math.min(Number(req.query.take) || 50, 100);
    const cursor = req.query.cursor as string | undefined;
    const exam = req.query.exam as string | undefined;
    const subject = req.query.subject as string | undefined;
    const q = (req.query.q as string | undefined)?.trim().toLowerCase();

    const where: Record<string, unknown> = { resolved: false };
    if (exam) where.exam = exam;
    if (subject) where.subject = subject;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const doubts = await prisma.doubt.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { threads: true } },
      },
    });

    const hasMore = doubts.length > take;
    const items = hasMore ? doubts.slice(0, take) : doubts;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    res.json({
      items: items.map((d) => ({
        id: d.id,
        authorId: d.authorId,
        authorName: d.author.name ?? "Anonymous",
        authorImage: d.author.image,
        exam: d.exam,
        subject: d.subject,
        title: d.title,
        preview:
          d.description.length > 220
            ? d.description.slice(0, 217) + "…"
            : d.description,
        imageUrl: d.imageUrl,
        urgent: d.urgent,
        resolved: d.resolved,
        needFasterMethod: d.needFasterMethod,
        mySolveTime: d.mySolveTime,
        viewerCount: d.viewerCount,
        helperCount: d.helperCount,
        threadCount: d._count.threads,
        createdAt: d.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch doubts" });
  }
});

/** GET /doubts/:id — single doubt with full description. */
doubtsRouter.get("/:id", async (req, res) => {
  try {
    const doubt = await prisma.doubt.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, image: true, karma: true } },
        _count: { select: { threads: true } },
      },
    });

    if (!doubt) {
      res.status(404).json({ error: "Doubt not found" });
      return;
    }

    // Bump viewer count
    await prisma.doubt.update({
      where: { id: doubt.id },
      data: { viewerCount: { increment: 1 } },
    });

    res.json({
      ...doubt,
      authorName: doubt.author.name,
      authorKarma: doubt.author.karma,
      threadCount: doubt._count.threads,
      viewerCount: doubt.viewerCount + 1,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch doubt" });
  }
});

/** POST /doubts — create a new doubt. Body: { authorId, exam, subject, title, description, urgent?, imageUrl? } */
doubtsRouter.post("/", async (req, res) => {
  try {
    const { authorId, exam, subject, title, description, urgent, imageUrl, mySolveTime, needFasterMethod } =
      req.body ?? {};

    if (!authorId || !exam || !subject || !title) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (title.length > 200) {
      res.status(400).json({ error: "Title too long (max 200 chars)" });
      return;
    }

    if (description.length > 2000) {
      res.status(400).json({ error: "Description too long (max 2000 chars)" });
      return;
    }

    const doubt = await prisma.doubt.create({
      data: {
        authorId,
        exam,
        subject,
        title: title.trim(),
        description: (description ?? title).trim(),
        mySolveTime: mySolveTime?.trim().slice(0, 30) ?? null,
        needFasterMethod: Boolean(needFasterMethod),
        urgent: Boolean(urgent),
        imageUrl: imageUrl ?? null,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const payload = {
      id: doubt.id,
      authorId: doubt.authorId,
      authorName: doubt.author.name ?? "Anonymous",
      authorImage: doubt.author.image,
      exam: doubt.exam,
      subject: doubt.subject,
      title: doubt.title,
      preview:
        doubt.description.length > 220
          ? doubt.description.slice(0, 217) + "…"
          : doubt.description,
      imageUrl: doubt.imageUrl,
      urgent: doubt.urgent,
      resolved: doubt.resolved,
      needFasterMethod: doubt.needFasterMethod,
      mySolveTime: doubt.mySolveTime,
      viewerCount: doubt.viewerCount,
      helperCount: doubt.helperCount,
      threadCount: 0,
      createdAt: doubt.createdAt.toISOString(),
    };

    emitNewDoubt(payload);
    res.status(201).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create doubt" });
  }
});

/** PATCH /doubts/:id/resolve — mark as resolved. Body: { authorId } */
doubtsRouter.patch("/:id/resolve", async (req, res) => {
  try {
    const doubt = await prisma.doubt.findUnique({
      where: { id: req.params.id },
    });

    if (!doubt) {
      res.status(404).json({ error: "Doubt not found" });
      return;
    }

    if (doubt.authorId !== req.body?.authorId) {
      res.status(403).json({ error: "Only the author can resolve" });
      return;
    }

    const updated = await prisma.doubt.update({
      where: { id: doubt.id },
      data: { resolved: true },
    });

    emitDoubtUpdate(updated.id, { resolved: true });
    res.json({ id: updated.id, resolved: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to resolve doubt" });
  }
});
