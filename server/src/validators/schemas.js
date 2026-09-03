import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const businessSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
});

export const moduleSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
});

export const fieldSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "Field name must be snake_case (e.g. phone_number)"),
  label: z.string().min(1),
  type: z.enum(["text", "number", "date", "select", "boolean", "textarea"]),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional().default([]),
});

// AI must return exactly this shape. Anything else is rejected before
// it ever touches the database — see services/aiService.js.
export const aiConfigSchema = z.object({
  modules: z
    .array(
      z.object({
        name: z.string().min(1),
        icon: z.string().optional().default("Layers"),
        fields: z
          .array(
            z.object({
              name: z.string().regex(/^[a-z][a-z0-9_]*$/),
              label: z.string().min(1),
              type: z.enum(["text", "number", "date", "select", "boolean", "textarea"]),
              required: z.boolean().optional().default(false),
              options: z.array(z.string()).optional().default([]),
            })
          )
          .min(1),
      })
    )
    .min(1),
});

// Builds a dynamic Zod object schema from a module's stored `fields` rows,
// so record data submitted by the user is validated against whatever
// fields that module currently has -- this IS the "dynamic" part of the
// dynamic ERP engine, without ever touching real SQL schema.
export function buildRecordSchema(fieldsRows) {
  const shape = {};
  for (const f of fieldsRows) {
    let base;
    switch (f.type) {
      case "number":
        base = z.coerce.number();
        break;
      case "boolean":
        base = z.coerce.boolean();
        break;
      case "date":
        base = z.string(); // ISO date string
        break;
      case "select":
        base = z.string();
        break;
      default:
        base = z.string();
    }
    shape[f.name] = f.required ? base : base.optional().nullable();
  }
  return z.object(shape);
}
