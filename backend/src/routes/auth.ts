import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const APP_PASSWORD = process.env.APP_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// POST /api/auth/login
router.post("/login", (req: Request, res: Response) => {
  const { password } = req.body;

  if (!APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    // In dev, allow login without a password configured
  } else if (password !== APP_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = jwt.sign({ purpose: "app-access" }, JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({ token });
});

export default router;
