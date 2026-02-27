import { Router, Request, Response } from "express";
import Groq from "groq-sdk";

const router = Router();

// POST /api/estimate-weight
router.post("/", async (req: Request, res: Response) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      res.status(500).json({ error: "AI not configured" });
      return;
    }

    const { name, type, link } = req.body;

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const prompt = `You are a shipping weight estimation expert for clothing and fashion items, specifically for items purchased from Chinese marketplaces (Taobao, Weidian, 1688) and shipped internationally.

Estimate the shipping weight in grams for this item. Shipping weight includes the item itself plus basic packaging (poly bag, sometimes a box for shoes).

Item name: ${name}
Item type: ${type || "unknown"}
${link ? `Item link: ${link}` : ""}

Consider:
- Clothing: fabric weight, size category, hardware (zippers, buttons)
- Shoes: typically heavier, include box weight (~300-400g for box)
- Accessories: varies widely (belts, bags, jewelry, hats)
- Replicas/fashion items from China often use similar materials to retail

Respond with ONLY a JSON object in this exact format, no other text:
{"weightGrams": <number>, "confidence": "<low|medium|high>", "reasoning": "<brief 1-sentence explanation>"}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const text = result.choices[0]?.message?.content?.trim() || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.weightGrams || typeof parsed.weightGrams !== "number") {
      res.status(500).json({ error: "Invalid weight estimate" });
      return;
    }

    res.json({
      weightGrams: Math.round(parsed.weightGrams),
      confidence: parsed.confidence || "medium",
      reasoning: parsed.reasoning || "",
    });
  } catch (error) {
    console.error("Weight estimation error:", error);
    res.status(500).json({ error: "Failed to estimate weight" });
  }
});

export default router;
