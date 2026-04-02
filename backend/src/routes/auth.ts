import bcrypt from "bcrypt";
import { Router } from "express";

import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post("/register", async (req, res) => {
  try {
    const rawEmail = req.body?.email as string | undefined;
    const password = req.body?.password as string | undefined;
    const rawName = req.body?.name as string | undefined;

    const email = rawEmail?.trim().toLowerCase() ?? "";
    const name = rawName?.trim() ?? "";

    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (!name || name.length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isGuest: false,
        karma: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        karma: true,
      },
    });

    res.status(201).json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const rawEmail = req.body?.email as string | undefined;
    const password = req.body?.password as string | undefined;
    const email = rawEmail?.trim().toLowerCase() ?? "";

    if (!email || !password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        karma: user.karma,
        image: user.image,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});
