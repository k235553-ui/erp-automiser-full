import { db } from "../db/connection.js";
import { randomUUID } from "crypto";

// ---------- Users ----------
export const Users = {
  create({ email, passwordHash }) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`
    ).run(id, email, passwordHash);
    return { id, email };
  },
  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  },
  findById(id) {
    return db.prepare(`SELECT id, email FROM users WHERE id = ?`).get(id);
  },
};

// ---------- Businesses ----------
export const Businesses = {
  create({ userId, name, type }) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO businesses (id, user_id, name, type) VALUES (?, ?, ?, ?)`
    ).run(id, userId, name, type || null);
    return this.findById(id);
  },
  listForUser(userId) {
    return db
      .prepare(`SELECT * FROM businesses WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId);
  },
  findById(id) {
    return db.prepare(`SELECT * FROM businesses WHERE id = ?`).get(id);
  },
  belongsToUser(businessId, userId) {
    const b = this.findById(businessId);
    return !!b && b.user_id === userId;
  },
  setTier(id, tier) {
    db.prepare(`UPDATE businesses SET tier = ? WHERE id = ?`).run(tier, id);
    return this.findById(id);
  },
  moduleCount(id) {
    return db.prepare(`SELECT COUNT(*) as c FROM modules WHERE business_id = ?`).get(id).c;
  },
};

// ---------- Business Members (employee management / access tiers) ----------
export const BusinessMembers = {
  invite({ businessId, email, role }) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO business_members (id, business_id, email, role) VALUES (?, ?, ?, ?)`
    ).run(id, businessId, email, role);
    return this.findById(id);
  },
  listForBusiness(businessId) {
    return db
      .prepare(`SELECT * FROM business_members WHERE business_id = ? ORDER BY created_at ASC`)
      .all(businessId);
  },
  findById(id) {
    return db.prepare(`SELECT * FROM business_members WHERE id = ?`).get(id);
  },
  count(businessId) {
    return db.prepare(`SELECT COUNT(*) as c FROM business_members WHERE business_id = ?`).get(businessId).c;
  },
  updateRole(id, role) {
    db.prepare(`UPDATE business_members SET role = ? WHERE id = ?`).run(role, id);
    return this.findById(id);
  },
  remove(id) {
    db.prepare(`DELETE FROM business_members WHERE id = ?`).run(id);
  },
  // Links a member row to a real user account once that email registers/logs in
  linkUserByEmail(email, userId) {
    db.prepare(`UPDATE business_members SET user_id = ? WHERE email = ? AND user_id IS NULL`).run(userId, email);
  },
};

// ---------- Modules ----------
export const Modules = {
  create({ businessId, name, icon }) {
    const id = randomUUID();
    const maxOrder =
      db
        .prepare(`SELECT MAX(sort_order) as m FROM modules WHERE business_id = ?`)
        .get(businessId)?.m || 0;
    db.prepare(
      `INSERT INTO modules (id, business_id, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)`
    ).run(id, businessId, name, icon || "Layers", maxOrder + 1);
    return this.findById(id);
  },
  listForBusiness(businessId) {
    return db
      .prepare(`SELECT * FROM modules WHERE business_id = ? ORDER BY sort_order ASC`)
      .all(businessId);
  },
  findById(id) {
    return db.prepare(`SELECT * FROM modules WHERE id = ?`).get(id);
  },
  delete(id) {
    db.prepare(`DELETE FROM modules WHERE id = ?`).run(id);
  },
  fieldCount(moduleId) {
    return db.prepare(`SELECT COUNT(*) as c FROM fields WHERE module_id = ?`).get(moduleId).c;
  },
};

// ---------- Fields ----------
export const Fields = {
  create({ moduleId, name, label, type, required, options }) {
    const id = randomUUID();
    const maxOrder =
      db
        .prepare(`SELECT MAX(sort_order) as m FROM fields WHERE module_id = ?`)
        .get(moduleId)?.m || 0;
    db.prepare(
      `INSERT INTO fields (id, module_id, name, label, type, required, options, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      moduleId,
      name,
      label,
      type,
      required ? 1 : 0,
      JSON.stringify(options || []),
      maxOrder + 1
    );
    return this.findById(id);
  },
  listForModule(moduleId) {
    const rows = db
      .prepare(`SELECT * FROM fields WHERE module_id = ? ORDER BY sort_order ASC`)
      .all(moduleId);
    return rows.map((r) => ({
      ...r,
      required: !!r.required,
      options: JSON.parse(r.options || "[]"),
    }));
  },
  findById(id) {
    const r = db.prepare(`SELECT * FROM fields WHERE id = ?`).get(id);
    if (!r) return null;
    return { ...r, required: !!r.required, options: JSON.parse(r.options || "[]") };
  },
  delete(id) {
    db.prepare(`DELETE FROM fields WHERE id = ?`).run(id);
  },
};

// ---------- Records (generic, metadata-driven) ----------
export const Records = {
  create({ moduleId, data }) {
    const id = randomUUID();
    db.prepare(`INSERT INTO records (id, module_id, data) VALUES (?, ?, ?)`).run(
      id,
      moduleId,
      JSON.stringify(data)
    );
    return this.findById(id);
  },
  listForModule(moduleId) {
    const rows = db
      .prepare(`SELECT * FROM records WHERE module_id = ? ORDER BY created_at DESC`)
      .all(moduleId);
    return rows.map((r) => ({ ...r, data: JSON.parse(r.data) }));
  },
  findById(id) {
    const r = db.prepare(`SELECT * FROM records WHERE id = ?`).get(id);
    if (!r) return null;
    return { ...r, data: JSON.parse(r.data) };
  },
  update(id, data) {
    db.prepare(
      `UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(JSON.stringify(data), id);
    return this.findById(id);
  },
  delete(id) {
    db.prepare(`DELETE FROM records WHERE id = ?`).run(id);
  },
};

// ---------- AI Recommendations (audit trail) ----------
export const AiRecommendations = {
  create({ businessId, rawInput, generatedConfig }) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO ai_recommendations (id, business_id, raw_input, generated_config)
       VALUES (?, ?, ?, ?)`
    ).run(id, businessId, rawInput, JSON.stringify(generatedConfig));
    return id;
  },
};
