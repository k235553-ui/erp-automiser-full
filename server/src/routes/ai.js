import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Businesses, AiRecommendations } from "../models/index.js";
import { generateErpConfig } from "../services/aiService.js";

const router = Router();
router.use(requireAuth);

// Takes free-text business description, returns a validated JSON config
// for the user to review/edit -- never auto-applied, never trusted blindly.
router.post("/recommend/:businessId", async (req, res) => {
  if (!Businesses.belongsToUser(req.params.businessId, req.userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { description } = req.body;
  if (!description || typeof description !== "string" || description.trim().length < 5) {
    return res.status(400).json({ error: "Please describe your business in a sentence or two." });
  }

  try {
    const { config, source } = await generateErpConfig(description);
    AiRecommendations.create({
      businessId: req.params.businessId,
      rawInput: description,
      generatedConfig: config,
    });
    res.json({ config, source }); // source: "ai" | "fallback" -- shown in UI for transparency
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
});

export default router;
