import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Businesses, BusinessMembers, Modules } from "../models/index.js";
import { TIERS, getTierConfig, isWithinLimit } from "../services/tiers.js";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

// Public-ish reference data: the full package table, for rendering the
// pricing/comparison page. No auth-sensitive data here.
router.get("/tiers", (req, res) => {
  res.json(TIERS);
});

// Current usage vs this business's tier limits -- powers progress
// indicators ("3/5 modules used") and locked-state UI.
router.get("/business/:businessId/usage", (req, res) => {
  const business = Businesses.findById(req.params.businessId);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const tierConfig = getTierConfig(business.tier);
  res.json({
    tier: business.tier,
    tierConfig,
    usage: {
      modules: Businesses.moduleCount(business.id),
      teamMembers: BusinessMembers.count(business.id),
    },
  });
});

// DEMO upgrade/downgrade: no real payment integration. Real Stripe/JazzCash
// integration would replace this handler with a checkout redirect + webhook
// that calls Businesses.setTier() on payment confirmation.
router.post("/business/:businessId/upgrade", (req, res) => {
  const business = Businesses.findById(req.params.businessId);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = z.object({ tier: z.enum(["silver", "gold", "premium"]) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid tier" });
  }
  const updated = Businesses.setTier(business.id, parsed.data.tier);
  res.json(updated);
});

// ---------- Team / employee management ----------

router.get("/business/:businessId/members", (req, res) => {
  const business = Businesses.findById(req.params.businessId);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(BusinessMembers.listForBusiness(business.id));
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["viewer", "editor", "full"]),
});

router.post("/business/:businessId/members", (req, res) => {
  const business = Businesses.findById(req.params.businessId);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const tierConfig = getTierConfig(business.tier);
  if (!tierConfig.teamRoles.includes(parsed.data.role)) {
    return res.status(402).json({
      error: `Your ${tierConfig.label} plan doesn't include the "${parsed.data.role}" role. Upgrade to unlock it.`,
      limitReached: true,
    });
  }
  const currentCount = BusinessMembers.count(business.id);
  if (!isWithinLimit(currentCount, tierConfig.teamMemberLimit)) {
    return res.status(402).json({
      error: `Your ${tierConfig.label} plan allows up to ${tierConfig.teamMemberLimit} team member(s). Upgrade to invite more.`,
      limitReached: true,
    });
  }

  try {
    const member = BusinessMembers.invite({ businessId: business.id, ...parsed.data });
    res.status(201).json(member);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "This email is already a member of this business." });
    }
    throw err;
  }
});

router.put("/members/:memberId", (req, res) => {
  const member = BusinessMembers.findById(req.params.memberId);
  if (!member) return res.status(404).json({ error: "Member not found" });
  const business = Businesses.findById(member.business_id);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = z.object({ role: z.enum(["viewer", "editor", "full"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid role" });

  const tierConfig = getTierConfig(business.tier);
  if (!tierConfig.teamRoles.includes(parsed.data.role)) {
    return res.status(402).json({
      error: `Your ${tierConfig.label} plan doesn't include the "${parsed.data.role}" role. Upgrade to unlock it.`,
      limitReached: true,
    });
  }
  res.json(BusinessMembers.updateRole(member.id, parsed.data.role));
});

router.delete("/members/:memberId", (req, res) => {
  const member = BusinessMembers.findById(req.params.memberId);
  if (!member) return res.status(404).json({ error: "Member not found" });
  const business = Businesses.findById(member.business_id);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  BusinessMembers.remove(member.id);
  res.status(204).end();
});

export default router;
