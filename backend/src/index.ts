import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import quotesRouter from "./routes/quotes";
import itemsRouter from "./routes/items";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Health check (public)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/quotes", requireAuth, quotesRouter);
app.use("/api", requireAuth, itemsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
