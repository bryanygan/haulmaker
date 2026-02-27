import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import { requireAuth } from "./middleware/auth";
import quotesRouter from "./routes/quotes";
import itemsRouter from "./routes/items";
import estimateRouter from "./routes/estimate";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    // Allow exact match (without trailing slash)
    if (origin === frontendUrl) return callback(null, true);
    // Allow Cloudflare Pages preview deployments (*.haulmaker.pages.dev)
    if (/^https:\/\/[a-z0-9]+\.haulmaker\.pages\.dev$/.test(origin)) return callback(null, true);
    // Allow localhost for dev
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);

    callback(null, false);
  },
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
app.use("/api/estimate-weight", requireAuth, estimateRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
