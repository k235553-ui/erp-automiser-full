import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Businesses, Modules, Fields } from "../models/index.js";
import { moduleSchema, fieldSchema } from "../validators/schemas.js";
import { getTierConfig, isWithinLimit } from "../services/tiers.js";

const router = Router();
router.use(requireAuth);

// Ensures the caller owns the business behind this module before any
// read/write -- prevents cross-tenant data access.
function assertOwnsModule(req, res, moduleId) {
  const mod = Modules.findById(moduleId);
  if (!mod) {
    res.status(404).json({ error: "Module not found" });
    return null;
  }
  if (!Businesses.belongsToUser(mod.business_id, req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return mod;
}

// List modules for a business
router.get("/business/:businessId", (req, res) => {
  if (!Businesses.belongsToUser(req.params.businessId, req.userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const modules = Modules.listForBusiness(req.params.businessId).map((m) => ({
    ...m,
    fields: Fields.listForModule(m.id),
  }));
  res.json(modules);
});

// Create a module -- capped by the business's tier ("Command Customization"
// in the package table). Returns 402 (Payment Required) when the tier's
// module limit is hit, so the frontend can show an upgrade prompt.
router.post("/business/:businessId", (req, res) => {
  const business = Businesses.findById(req.params.businessId);
  if (!business || business.user_id !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = moduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const tierConfig = getTierConfig(business.tier);
  const currentCount = Businesses.moduleCount(business.id);
  if (!isWithinLimit(currentCount, tierConfig.moduleLimit)) {
    return res.status(402).json({
      error: `Your ${tierConfig.label} plan allows up to ${tierConfig.moduleLimit} modules. Upgrade to add more.`,
      limitReached: true,
    });
  }

  const mod = Modules.create({ businessId: business.id, ...parsed.data });
  res.status(201).json({ ...mod, fields: [] });
});

router.delete("/:moduleId", (req, res) => {
  const mod = assertOwnsModule(req, res, req.params.moduleId);
  if (!mod) return;
  Modules.delete(mod.id);
  res.status(204).end();
});

// Add a field to a module -- this is the "customize fields" step,
// also capped by tier (fields per module).
router.post("/:moduleId/fields", (req, res) => {
  const mod = assertOwnsModule(req, res, req.params.moduleId);
  if (!mod) return;

  const parsed = fieldSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const business = Businesses.findById(mod.business_id);
  const tierConfig = getTierConfig(business.tier);
  const currentCount = Modules.fieldCount(mod.id);
  if (!isWithinLimit(currentCount, tierConfig.fieldLimitPerModule)) {
    return res.status(402).json({
      error: `Your ${tierConfig.label} plan allows up to ${tierConfig.fieldLimitPerModule} fields per module. Upgrade to add more.`,
      limitReached: true,
    });
  }

  const field = Fields.create({ moduleId: mod.id, ...parsed.data });
  res.status(201).json(field);
});

router.delete("/fields/:fieldId", (req, res) => {
  const field = Fields.findById(req.params.fieldId);
  if (!field) return res.status(404).json({ error: "Field not found" });
  const mod = assertOwnsModule(req, res, field.module_id);
  if (!mod) return;
  Fields.delete(field.id);
  res.status(204).end();
});

// Bulk-apply a (user-reviewed) AI config: creates all modules + fields at
// once. Body: { modules: [{ name, icon, fields: [...] }] } -- same shape
// aiConfigSchema produces, but the user may have edited it in the UI first.
router.post("/business/:businessId/apply-config", (req, res) => {
  if (!Businesses.belongsToUser(req.params.businessId, req.userId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { modules } = req.body;
  if (!Array.isArray(modules)) {
    return res.status(400).json({ error: "Expected { modules: [...] }" });
  }

  const created = [];
  for (const m of modules) {
    const modParsed = moduleSchema.safeParse({ name: m.name, icon: m.icon });
    if (!modParsed.success) continue; // skip invalid entries rather than fail the whole batch
    const mod = Modules.create({ businessId: req.params.businessId, ...modParsed.data });

    const savedFields = [];
    for (const f of m.fields || []) {
      const fieldParsed = fieldSchema.safeParse(f);
      if (!fieldParsed.success) continue;
      savedFields.push(Fields.create({ moduleId: mod.id, ...fieldParsed.data }));
    }
    created.push({ ...mod, fields: savedFields });
  }

  res.status(201).json(created);
});

export default router;
