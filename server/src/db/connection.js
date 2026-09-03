// db/connection.js
// -----------------------------------------------------------------------------
// Local dev uses SQLite (zero setup). To move to Postgres later:
//   1. npm install pg
//   2. Replace this file's exports with a `pg` Pool wrapper that exposes the
//      same .prepare/.exec-style helpers used below (or refactor models to
//      use SQL with $1/$2 placeholders instead of ?).
//   3. Change JSONB columns (currently stored as TEXT) to real jsonb columns.
// The schema/entities themselves (users, businesses, modules, fields,
// records) don't change — only the driver does.
// -----------------------------------------------------------------------------
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "erp_automiser.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT,
      tier TEXT NOT NULL DEFAULT 'silver', -- silver|gold|premium, see services/tiers.js
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_members (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- filled in once that email registers/logs in
      role TEXT NOT NULL DEFAULT 'viewer', -- viewer|editor|full (view-only / add-edit / add-edit-delete)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(business_id, email)
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Layers',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text', -- text|number|date|select|boolean|textarea
      required INTEGER DEFAULT 0,
      options TEXT DEFAULT '[]', -- JSON array, used for 'select' type
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      data TEXT NOT NULL DEFAULT '{}', -- JSON blob matching the module's fields
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      raw_input TEXT,
      generated_config TEXT, -- JSON
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_members_business ON business_members(business_id);
    CREATE INDEX IF NOT EXISTS idx_modules_business ON modules(business_id);
    CREATE INDEX IF NOT EXISTS idx_fields_module ON fields(module_id);
    CREATE INDEX IF NOT EXISTS idx_records_module ON records(module_id);
  `);
}
