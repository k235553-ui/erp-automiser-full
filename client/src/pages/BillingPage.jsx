import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { api } from "../api/client.js";
import AppShell from "../components/AppShell.jsx";
import TierBadge from "../components/TierBadge.jsx";

const FEATURE_ROWS = [
  { key: "core", label: "Basic Dashboard, Inventory, Sales, Customers, Expenses", allTiers: true },
  { key: "financialReports", label: "Financial Reports" },
  { key: "automation", label: "Automation" },
  { key: "commandCustomization", label: "Command Customization" },
  { key: "employeeManagement", label: "Employee Management" },
  { key: "advancedAnalytics", label: "Advanced Analytics" },
  { key: "customWorkflows", label: "Custom Workflows" },
  { key: "advancedReports", label: "Advanced Reports" },
  { key: "paidAddons", label: "Paid Add-ons" },
];

const TIER_ORDER = ["silver", "gold", "premium"];

function FeatureValue({ value }) {
  if (value === "locked" || value === undefined) return <Minus size={15} className="text-muted mx-auto" />;
  if (value === "available" || value === "unlocked" || value === "full") {
    return <Check size={15} className="text-accent mx-auto" />;
  }
  return <span className="text-xs text-ink capitalize">{value}</span>;
}

export default function BillingPage() {
  const { businessId } = useParams();
  const [tiers, setTiers] = useState(null);
  const [usage, setUsage] = useState(null);
  const [upgrading, setUpgrading] = useState(null);

  async function refresh() {
    const [tiersData, usageData] = await Promise.all([api.getTiers(), api.getUsage(businessId)]);
    setTiers(tiersData);
    setUsage(usageData);
  }

  useEffect(() => {
    refresh();
  }, [businessId]);

  async function handleUpgrade(tier) {
    setUpgrading(tier);
    try {
      await api.upgradeTier(businessId, tier);
      await refresh();
    } finally {
      setUpgrading(null);
    }
  }

  if (!tiers || !usage)
    return (
      <AppShell>
        <div className="px-8 py-10 text-sm text-muted">Loading...</div>
      </AppShell>
    );

  return (
    <AppShell>
    <div className="px-8 py-10 max-w-4xl">
      <h1 className="font-display text-2xl text-ink mb-1">Billing &amp; Plan</h1>
      <p className="text-sm text-muted mb-2">
        Currently on <TierBadge tier={usage.tier} className="mx-1" /> ·{" "}
        <span className="font-mono">
          {usage.usage.modules}
          {usage.tierConfig.moduleLimit ? `/${usage.tierConfig.moduleLimit}` : ""}
        </span>{" "}
        modules used ·{" "}
        <span className="font-mono">
          {usage.usage.teamMembers}
          {usage.tierConfig.teamMemberLimit ? `/${usage.tierConfig.teamMemberLimit}` : ""}
        </span>{" "}
        team members
      </p>
      <p className="text-xs text-muted mb-8">
        Demo mode — upgrading here changes your plan instantly with no real payment, so you can test tier limits.
      </p>

      <div className="border border-line rounded overflow-hidden bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left px-5 py-4 font-medium text-muted w-1/3">Feature</th>
              {TIER_ORDER.map((t) => (
                <th key={t} className="px-5 py-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <TierBadge tier={t} />
                    <span className="font-display text-lg text-ink font-mono">{tiers[t].priceLabel}</span>
                    {usage.tier === t ? (
                      <span className="text-xs text-accent font-medium">Current plan</span>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(t)}
                        disabled={upgrading === t}
                        className="mt-1 px-3 py-1 bg-accent text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        {upgrading === t ? "Switching..." : "Switch to " + tiers[t].label}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-line last:border-b-0">
                <td className="px-5 py-3 text-ink">{row.label}</td>
                {TIER_ORDER.map((t) => (
                  <td key={t} className="px-5 py-3 text-center">
                    {row.allTiers ? (
                      <Check size={15} className="text-accent mx-auto" />
                    ) : (
                      <FeatureValue value={tiers[t].features[row.key]} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        Financial Reports, Automation, Advanced Analytics, and Custom Workflows are on the FYP roadmap as future
        phases — this page shows what each plan will unlock once they're built. Module/field limits and Employee
        Management are live and enforced today.
      </p>
    </div>
    </AppShell>
  );
}
