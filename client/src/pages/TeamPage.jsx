import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, X, Lock } from "lucide-react";
import { api } from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

const ROLE_LABELS = { viewer: "View-only", editor: "Add / Edit", full: "Full access" };
const ROLE_DESCRIPTIONS = {
  viewer: "Can see records but not add, edit, or delete them.",
  editor: "Can add and edit records, but not delete them.",
  full: "Can add, edit, and delete records.",
};

export default function TeamPage() {
  const { businessId } = useParams();
  const [members, setMembers] = useState([]);
  const [usage, setUsage] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);

  async function refresh() {
    const [membersData, usageData] = await Promise.all([api.listMembers(businessId), api.getUsage(businessId)]);
    setMembers(membersData);
    setUsage(usageData);
  }

  useEffect(() => {
    refresh();
  }, [businessId]);

  async function handleInvite(e) {
    e.preventDefault();
    setError("");
    setInviting(true);
    try {
      await api.inviteMember(businessId, email, role);
      setEmail("");
      setRole("viewer");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      await api.updateMemberRole(memberId, newRole);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(memberId) {
    if (!confirm("Remove this team member?")) return;
    await api.removeMember(memberId);
    refresh();
  }

  if (!usage)
    return (
      <AppShell>
        <div className="px-8 py-10 text-sm text-muted">Loading...</div>
      </AppShell>
    );

  const availableRoles = usage.tierConfig.teamRoles;
  const atLimit =
    usage.tierConfig.teamMemberLimit !== null && members.length >= usage.tierConfig.teamMemberLimit;

  return (
    <AppShell>
    <div className="px-8 py-10 max-w-2xl">
      <h1 className="font-display text-2xl text-ink mb-1">Team</h1>
      <p className="text-sm text-muted mb-8">
        <span className="font-mono">
          {members.length}
          {usage.tierConfig.teamMemberLimit ? `/${usage.tierConfig.teamMemberLimit}` : ""}
        </span>{" "}
        members on your {usage.tierConfig.label} plan
      </p>

      <div className="bg-panel border border-line rounded p-5 mb-6">
        {atLimit ? (
          <div className="flex items-start gap-3 text-sm">
            <Lock size={16} className="text-muted mt-0.5" />
            <div>
              <p className="text-ink font-medium">You've reached your team member limit.</p>
              <p className="text-muted mt-0.5">
                Upgrade your plan from the Billing page to invite more team members.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="teammate@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-line rounded text-sm bg-panel"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 border border-line rounded text-sm bg-panel"
              >
                {["viewer", "editor", "full"].map((r) => (
                  <option key={r} value={r} disabled={!availableRoles.includes(r)}>
                    {ROLE_LABELS[r]} {!availableRoles.includes(r) ? "(upgrade to unlock)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded text-sm font-medium disabled:opacity-50"
              >
                <Plus size={15} /> Invite
              </button>
            </div>
            <p className="text-xs text-muted">{ROLE_DESCRIPTIONS[role]}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </div>

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-muted">No team members yet.</p>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between bg-panel border border-line rounded px-4 py-3"
            >
              <div>
                <p className="text-sm text-ink font-medium">{m.email}</p>
                <p className="text-xs text-muted">{m.user_id ? "Active" : "Pending — will link once they register"}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="px-2 py-1 border border-line rounded text-xs bg-panel"
                >
                  {["viewer", "editor", "full"].map((r) => (
                    <option key={r} value={r} disabled={!availableRoles.includes(r)}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleRemove(m.id)} className="text-muted hover:text-red-600">
                  <X size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </AppShell>
  );
}
