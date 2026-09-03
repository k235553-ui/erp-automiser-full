import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Businesses, Modules, Fields, Records } from "../models/index.js";
import { buildRecordSchema } from "../validators/schemas.js";

const router = Router();
router.use(requireAuth);

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

// List records for a module
router.get("/module/:moduleId", (req, res) => {
  const mod = assertOwnsModule(req, res, req.params.moduleId);
  if (!mod) return;
  res.json(Records.listForModule(mod.id));
});

// Create a record -- validated dynamically against the module's current fields.
// This is the core of the metadata-driven engine: no per-module SQL table,
// the same endpoint handles Customers, Inventory, or any module a user builds.
router.post("/module/:moduleId", (req, res) => {
  const mod = assertOwnsModule(req, res, req.params.moduleId);
  if (!mod) return;

  const fields = Fields.listForModule(mod.id);
  const schema = buildRecordSchema(fields);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const record = Records.create({ moduleId: mod.id, data: parsed.data });
  res.status(201).json(record);
});

router.put("/:recordId", (req, res) => {
  const existing = Records.findById(req.params.recordId);
  if (!existing) return res.status(404).json({ error: "Record not found" });
  const mod = assertOwnsModule(req, res, existing.module_id);
  if (!mod) return;

  const fields = Fields.listForModule(mod.id);
  const schema = buildRecordSchema(fields);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  res.json(Records.update(existing.id, parsed.data));
});

router.delete("/:recordId", (req, res) => {
  const existing = Records.findById(req.params.recordId);
  if (!existing) return res.status(404).json({ error: "Record not found" });
  const mod = assertOwnsModule(req, res, existing.module_id);
  if (!mod) return;
  Records.delete(existing.id);
  res.status(204).end();
});

export default router;
