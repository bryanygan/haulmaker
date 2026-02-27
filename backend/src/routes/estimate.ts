import { Router, Request, Response } from "express";

const router = Router();

// POST /api/estimate-weight
router.post("/", async (req: Request, res: Response) => {
  try {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!PERPLEXITY_API_KEY) {
      res.status(500).json({ error: "AI not configured" });
      return;
    }

    const { name, type, link } = req.body;

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const prompt = `You are a shipping weight estimation expert for clothing and fashion items, specifically for items purchased from Chinese marketplaces (Taobao, Weidian, 1688) and shipped internationally.

Estimate BOTH the actual shipping weight AND volumetric weight in grams for this item.

- Actual weight: the item itself plus packaging (poly bag for clothing, box for shoes ~300-400g)
- Volumetric weight: (L x W x H in cm) / 5000 * 1000 to convert to grams

IMPORTANT: Always err on the side of OVERESTIMATING. This is for quoting customers, so a cushion is better than underestimating. Round up generously.

Item name: ${name}
Item type: ${type || "unknown"}
${link ? `Item link: ${link}` : ""}

Search the internet for the actual weight, dimensions, and materials of this specific item.

Consider:
- Clothing: fabric weight, size category, hardware (zippers, buttons)
- Shoes: typically heavier, always include box weight (~300-400g for box)
- Accessories: varies widely (belts, bags, jewelry, hats)
- Replicas/fashion items from China often use similar materials to retail

Respond with ONLY a JSON object in this exact format, no other text:
{"actualWeightGrams": <number>, "volumetricWeightGrams": <number>, "dimensions": "<LxWxH cm>", "confidence": "<low|medium|high>", "reasoning": "<brief 1-sentence explanation>"}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Perplexity API error:", response.status, errBody);
      res.status(500).json({ error: "AI service error" });
      return;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const actualWeight = parsed.actualWeightGrams;
    const volumetricWeight = parsed.volumetricWeightGrams;

    if (!actualWeight || typeof actualWeight !== "number") {
      res.status(500).json({ error: "Invalid weight estimate" });
      return;
    }

    // Use whichever is heavier: actual or volumetric
    const finalWeight = Math.max(actualWeight, volumetricWeight || 0);

    const usedVolumetric = volumetricWeight > actualWeight;

    res.json({
      weightGrams: Math.round(finalWeight),
      actualWeightGrams: Math.round(actualWeight),
      volumetricWeightGrams: volumetricWeight ? Math.round(volumetricWeight) : null,
      dimensions: parsed.dimensions || null,
      usedVolumetric,
      confidence: parsed.confidence || "medium",
      reasoning: parsed.reasoning || "",
    });
  } catch (error) {
    console.error("Weight estimation error:", error);
    res.status(500).json({ error: "Failed to estimate weight" });
  }
});

export default router;
