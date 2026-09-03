import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Businesses } from "../models/index.js";
import { businessSchema } from "../validators/schemas.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(Businesses.listForUser(req.userId));
});

router.post("/", (req, res) => {
  const parsed = businessSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const business = Businesses.create({ userId: req.userId, ...parsed.data });
  res.status(201).json(business);
});

router.get("/:id", (req, res) => {
  const business = Businesses.findById(req.params.id);
  if (!business || business.user_id !== req.userId) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(business);
});

export default router;
