import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { LayoutGrid, Users, CreditCard, ArrowLeft, LogOut } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";
import TierBadge from "./TierBadge.jsx";

// Shared shell for every page scoped to a business: sidebar with nav +
// tier badge, main content area on the right. Real business software
// (QuickBooks, Xero-style) uses this pattern rather than a marketing-style
// stacked-card layout, which is why it's used here.
export default function AppShell({ children }) {
  const { businessId } = useParams();
  const location = useLocation();
  const { logout } = useAuth();
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    if (businessId) api.getBusiness(businessId).then(setBusiness).catch(() => {});
  }, [businessId]);

  const navItems = [
    { to: `/business/${businessId}/dashboard`, label: "Dashboard", icon: LayoutGrid },
    { to: `/business/${businessId}/team`, label: "Team", icon: Users },
    { to: `/business/${businessId}/billing`, label: "Billing & Plan", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-sidebar flex flex-col">
        <div className="px-5 py-5 border-b border-lineDark">
          <Link to="/businesses" className="flex items-center gap-1.5 text-xs text-mutedDark hover:text-paper mb-3">
            <ArrowLeft size={12} /> All businesses
          </Link>
          <p className="font-display text-lg text-paper leading-tight truncate">{business?.name || "..."}</p>
          {business && (
            <div className="mt-2">
              <TierBadge tier={business.tier} />
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium ${
                  active ? "bg-panel/10 text-paper" : "text-mutedDark hover:bg-panel/5 hover:text-paper"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-lineDark">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-mutedDark hover:bg-panel/5 hover:text-paper w-full"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-paper">{children}</main>
    </div>
  );
}
