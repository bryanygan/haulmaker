import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// POST /api/quotes/:id/items
router.post("/quotes/:id/items", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const quoteId = req.params.id;

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }

    const { link, name, yuan, type, weightGrams, include, status } = req.body;

    if (!link || !name || yuan === undefined || !type) {
      res.status(400).json({ error: "link, name, yuan, and type are required" });
      return;
    }

    const itemCount = await prisma.item.count({ where: { quoteId } });

    const item = await prisma.item.create({
      data: {
        quoteId,
        link,
        name,
        yuan: Number(yuan),
        type,
        weightGrams: weightGrams !== undefined ? Number(weightGrams) : null,
        include: include !== undefined ? include : true,
        status: status || null,
        position: itemCount,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("POST /quotes/:id/items error:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PUT /api/items/:id
router.put("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { link, name, yuan, type, weightGrams, include, status } = req.body;

    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        ...(link !== undefined && { link }),
        ...(name !== undefined && { name }),
        ...(yuan !== undefined && { yuan: Number(yuan) }),
        ...(type !== undefined && { type }),
        ...(weightGrams !== undefined && {
          weightGrams: weightGrams === null ? null : Number(weightGrams),
        }),
        ...(include !== undefined && { include }),
        ...(status !== undefined && { status }),
      },
    });
    res.json(item);
  } catch (error) {
    console.error("PUT /items/:id error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// PUT /api/quotes/:id/reorder
router.put("/quotes/:id/reorder", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const quoteId = req.params.id;
    const { itemIds } = req.body as { itemIds: string[] };

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      res.status(400).json({ error: "itemIds array is required" });
      return;
    }

    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.item.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    const items = await prisma.item.findMany({
      where: { quoteId },
      orderBy: { position: "asc" },
    });

    res.json(items);
  } catch (error) {
    console.error("PUT /quotes/:id/reorder error:", error);
    res.status(500).json({ error: "Failed to reorder items" });
  }
});

// DELETE /api/items/:id
router.delete("/items/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.item.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("DELETE /items/:id error:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
