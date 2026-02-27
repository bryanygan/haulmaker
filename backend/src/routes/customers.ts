import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/customers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    res.json(customers);
  } catch (error) {
    console.error("GET /customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// POST /api/customers
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, discordHandle } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const customer = await prisma.customer.create({
      data: { name, discordHandle },
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error("POST /customers error:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// PUT /api/customers/:id
router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { name, discordHandle } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(discordHandle !== undefined && { discordHandle }),
      },
    });
    res.json(customer);
  } catch (error) {
    console.error("PUT /customers/:id error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error("DELETE /customers/:id error:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
