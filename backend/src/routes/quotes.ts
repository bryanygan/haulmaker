import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/quotes
router.get("/", async (_req: Request, res: Response) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(quotes);
  } catch (error) {
    console.error("GET /quotes error:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// POST /api/quotes
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerHandle,
      orderId,
      exchangeRate,
      fixedFeeUsd,
      shippingPerKgUsd,
      insuranceRate,
      haulFeeUsd,
    } = req.body;

    if (!customerName) {
      res.status(400).json({ error: "customerName is required" });
      return;
    }

    const quote = await prisma.quote.create({
      data: {
        customerName,
        customerHandle,
        orderId,
        ...(exchangeRate !== undefined && { exchangeRate }),
        ...(fixedFeeUsd !== undefined && { fixedFeeUsd }),
        ...(shippingPerKgUsd !== undefined && { shippingPerKgUsd }),
        ...(insuranceRate !== undefined && { insuranceRate }),
        ...(haulFeeUsd !== undefined && { haulFeeUsd }),
      },
      include: { items: true },
    });
    res.status(201).json(quote);
  } catch (error) {
    console.error("POST /quotes error:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
});

// GET /api/quotes/:id
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    res.json(quote);
  } catch (error) {
    console.error("GET /quotes/:id error:", error);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

// PUT /api/quotes/:id
router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const {
      customerName,
      customerHandle,
      orderId,
      exchangeRate,
      fixedFeeUsd,
      shippingPerKgUsd,
      insuranceRate,
      haulFeeUsd,
    } = req.body;

    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(customerHandle !== undefined && { customerHandle }),
        ...(orderId !== undefined && { orderId }),
        ...(exchangeRate !== undefined && { exchangeRate }),
        ...(fixedFeeUsd !== undefined && { fixedFeeUsd }),
        ...(shippingPerKgUsd !== undefined && { shippingPerKgUsd }),
        ...(insuranceRate !== undefined && { insuranceRate }),
        ...(haulFeeUsd !== undefined && { haulFeeUsd }),
      },
      include: { items: true },
    });
    res.json(quote);
  } catch (error) {
    console.error("PUT /quotes/:id error:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// DELETE /api/quotes/:id
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.quote.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("DELETE /quotes/:id error:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

export default router;
