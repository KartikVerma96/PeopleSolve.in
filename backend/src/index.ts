import http from "node:http";
import path from "node:path";

import cors from "cors";
import express from "express";

import { answersRouter } from "./routes/answers.js";
import { authRouter } from "./routes/auth.js";
import { challengesRouter } from "./routes/challenges.js";
import { doubtsRouter } from "./routes/doubts.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { paymentsRouter } from "./routes/payments.js";
import { referralsRouter } from "./routes/referrals.js";
import { reportsRouter } from "./routes/reports.js";
import { threadsRouter } from "./routes/threads.js";
import { uploadRouter } from "./routes/upload.js";
import { usersRouter } from "./routes/users.js";
import { initSocket } from "./socket.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded images
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "peoplesolve-backend" });
});

app.use("/answers", answersRouter);
app.use("/auth", authRouter);
app.use("/challenges", challengesRouter);
app.use("/doubts", doubtsRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/payments", paymentsRouter);
app.use("/referrals", referralsRouter);
app.use("/reports", reportsRouter);
app.use("/threads", threadsRouter);
app.use("/upload", uploadRouter);
app.use("/users", usersRouter);

const server = http.createServer(app);

initSocket(server, corsOrigin);

server.listen(port, () => {
  console.log(`PeopleSolve API listening on http://localhost:${port}`);
});
