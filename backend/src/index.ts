import http from "node:http";
import path from "node:path";

import cors from "cors";
import express from "express";

import { authRouter } from "./routes/auth.js";
import { doubtsRouter } from "./routes/doubts.js";
import { threadsRouter } from "./routes/threads.js";
import { uploadRouter } from "./routes/upload.js";
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

app.use("/auth", authRouter);
app.use("/doubts", doubtsRouter);
app.use("/threads", threadsRouter);
app.use("/upload", uploadRouter);

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, corsOrigin);

server.listen(port, () => {
  console.log(`PeopleSolve API listening on http://localhost:${port}`);
});
