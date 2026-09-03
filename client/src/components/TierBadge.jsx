const TIER_STYLES = {
  silver: "bg-silver-soft text-silver border-silver/30",
  gold: "bg-gold-soft text-gold border-gold/30",
  premium: "bg-premium-soft text-premium border-premium/30",
};

const TIER_LABELS = { silver: "Silver", gold: "Gold", premium: "Premium" };

export default function TierBadge({ tier, className = "" }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.silver;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${style} ${className}`}>
      {TIER_LABELS[tier] || tier}
    </span>
  );
}
