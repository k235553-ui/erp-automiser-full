// Maps the Silver / Gold / Premium package table directly to enforceable
// limits and feature flags. This is the single source of truth for what
// each tier can do -- both the backend (enforcement) and frontend
// (locked-state UI) read from the same shape via GET /api/billing/tiers.
//
// Honesty note: "reports", "automation", "analytics", and "workflows" are
// NOT implemented as real features yet (they're FUTURE-tier per the
// original roadmap). They're represented here as locked/unlocked flags so
// the UI can show what a tier unlocks, without pretending those features
// exist today. Only moduleLimit / fieldLimitPerModule / teamMemberLimit /
// teamRoles are actually enforced server-side right now.

export const TIERS = {
  silver: {
    label: "Silver",
    priceLabel: "Free",
    moduleLimit: 5,
    fieldLimitPerModule: 6,
    teamMemberLimit: 1, // "Limited/Optional" employee management
    teamRoles: ["viewer"], // can only invite view-only members
    features: {
      financialReports: "basic", // locked/basic/advanced
      automation: "limited",
      commandCustomization: "limited",
      employeeManagement: "limited",
      advancedAnalytics: "locked",
      customWorkflows: "locked",
      advancedReports: "locked",
      paidAddons: "available",
    },
  },
  gold: {
    label: "Gold",
    priceLabel: "PKR 2,000/mo",
    moduleLimit: 15,
    fieldLimitPerModule: 20,
    teamMemberLimit: 10,
    teamRoles: ["viewer", "editor", "full"],
    features: {
      financialReports: "advanced",
      automation: "advanced",
      commandCustomization: "more",
      employeeManagement: "full",
      advancedAnalytics: "unlocked",
      customWorkflows: "limited",
      advancedReports: "limited",
      paidAddons: "available",
    },
  },
  premium: {
    label: "Premium",
    priceLabel: "PKR 5,000/mo",
    moduleLimit: null, // unlimited
    fieldLimitPerModule: null,
    teamMemberLimit: null,
    teamRoles: ["viewer", "editor", "full"],
    features: {
      financialReports: "advanced",
      automation: "full",
      commandCustomization: "full",
      employeeManagement: "full",
      advancedAnalytics: "unlocked",
      customWorkflows: "unlocked",
      advancedReports: "unlocked",
      paidAddons: "available",
    },
  },
};

export function getTierConfig(tier) {
  return TIERS[tier] || TIERS.silver;
}

export function isWithinLimit(current, limit) {
  return limit === null || limit === undefined || current < limit;
}
