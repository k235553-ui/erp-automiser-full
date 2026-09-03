import { aiConfigSchema } from "../validators/schemas.js";

const SYSTEM_PROMPT = `You are an ERP configuration generator. Given a description of a business, output ONLY a JSON object (no markdown, no prose, no code fences) matching exactly this shape:

{
  "modules": [
    {
      "name": "string (e.g. 'Inventory')",
      "icon": "string (a lucide-react icon name, e.g. 'Package')",
      "fields": [
        {
          "name": "snake_case_field_name",
          "label": "Human Readable Label",
          "type": "text|number|date|select|boolean|textarea",
          "required": true,
          "options": ["only for type=select, list of choices, else empty array"]
        }
      ]
    }
  ]
}

Rules:
- Recommend 3-6 modules relevant to the described business.
- Each module should have 3-8 practical fields.
- field "name" MUST be snake_case and start with a lowercase letter.
- Output ONLY the JSON object. No explanation, no markdown fences.`;

// Small set of offline fallback templates so the app works end-to-end
// even without an ANTHROPIC_API_KEY configured yet (useful for demos/dev).
const FALLBACK_TEMPLATES = {
  clothing: {
    modules: [
      {
        name: "Inventory",
        icon: "Package",
        fields: [
          { name: "item_name", label: "Item Name", type: "text", required: true, options: [] },
          { name: "sku", label: "SKU", type: "text", required: true, options: [] },
          { name: "size", label: "Size", type: "select", required: false, options: ["S", "M", "L", "XL"] },
          { name: "quantity", label: "Quantity", type: "number", required: true, options: [] },
          { name: "unit_price", label: "Unit Price", type: "number", required: true, options: [] },
        ],
      },
      {
        name: "Suppliers",
        icon: "Truck",
        fields: [
          { name: "supplier_name", label: "Supplier Name", type: "text", required: true, options: [] },
          { name: "contact_phone", label: "Contact Phone", type: "text", required: false, options: [] },
          { name: "lead_time_days", label: "Lead Time (days)", type: "number", required: false, options: [] },
        ],
      },
      {
        name: "Customers",
        icon: "Users",
        fields: [
          { name: "full_name", label: "Full Name", type: "text", required: true, options: [] },
          { name: "email", label: "Email", type: "text", required: false, options: [] },
          { name: "phone", label: "Phone", type: "text", required: false, options: [] },
        ],
      },
      {
        name: "Sales",
        icon: "ShoppingCart",
        fields: [
          { name: "sale_date", label: "Sale Date", type: "date", required: true, options: [] },
          { name: "amount", label: "Amount", type: "number", required: true, options: [] },
          { name: "payment_method", label: "Payment Method", type: "select", required: false, options: ["Cash", "Card", "EasyPaisa", "JazzCash"] },
        ],
      },
      {
        name: "Expenses",
        icon: "Receipt",
        fields: [
          { name: "expense_date", label: "Date", type: "date", required: true, options: [] },
          { name: "category", label: "Category", type: "select", required: true, options: ["Rent", "Utilities", "Supplies", "Marketing", "Other"] },
          { name: "amount", label: "Amount", type: "number", required: true, options: [] },
        ],
      },
    ],
  },
  default: {
    modules: [
      {
        name: "Customers",
        icon: "Users",
        fields: [
          { name: "full_name", label: "Full Name", type: "text", required: true, options: [] },
          { name: "email", label: "Email", type: "text", required: false, options: [] },
          { name: "phone", label: "Phone", type: "text", required: false, options: [] },
        ],
      },
      {
        name: "Sales",
        icon: "ShoppingCart",
        fields: [
          { name: "sale_date", label: "Sale Date", type: "date", required: true, options: [] },
          { name: "amount", label: "Amount", type: "number", required: true, options: [] },
        ],
      },
      {
        name: "Expenses",
        icon: "Receipt",
        fields: [
          { name: "expense_date", label: "Date", type: "date", required: true, options: [] },
          { name: "amount", label: "Amount", type: "number", required: true, options: [] },
        ],
      },
    ],
  },
};

function pickFallback(input) {
  const lower = input.toLowerCase();
  if (lower.includes("cloth") || lower.includes("apparel") || lower.includes("fashion")) {
    return FALLBACK_TEMPLATES.clothing;
  }
  return FALLBACK_TEMPLATES.default;
}

async function callClaude(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // caller falls back to template

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", await response.text());
    return null;
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response as JSON:", text);
    return null;
  }
}

/**
 * Generates an ERP module/field configuration from free-text business
 * description. Always returns data validated against aiConfigSchema --
 * never raw/untrusted AI output. Falls back to a template if no API key
 * is set or the AI call/parse/validation fails.
 */
export async function generateErpConfig(rawInput) {
  let candidate = await callClaude(rawInput);

  if (!candidate) {
    candidate = pickFallback(rawInput);
  }

  const parsed = aiConfigSchema.safeParse(candidate);
  if (parsed.success) {
    return { config: parsed.data, source: candidate === pickFallback(rawInput) ? "fallback" : "ai" };
  }

  // AI produced something that doesn't match our schema -- don't trust it,
  // fall back to a safe template instead of saving garbage.
  console.warn("AI output failed schema validation, using fallback template:", parsed.error.message);
  const fallback = pickFallback(rawInput);
  return { config: aiConfigSchema.parse(fallback), source: "fallback" };
}
