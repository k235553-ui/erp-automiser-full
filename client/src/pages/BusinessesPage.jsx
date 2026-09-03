import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, LogOut } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.jsx";
import TierBadge from "../components/TierBadge.jsx";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    api.listBusinesses().then(setBusinesses).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const biz = await api.createBusiness(name, type);
      navigate(`/business/${biz.id}/setup`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">Your businesses</h1>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <LogOut size={15} /> Log out
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : (
        <div className="space-y-2 mb-6">
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => navigate(`/business/${b.id}/dashboard`)}
              className="w-full flex items-center gap-3 bg-panel border border-line rounded px-4 py-3 hover:border-accent text-left"
            >
              <Building2 size={18} className="text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{b.name}</p>
                {b.type && <p className="text-xs text-muted">{b.type}</p>}
              </div>
              <TierBadge tier={b.tier} />
            </button>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleCreate} className="bg-panel border border-line rounded p-4 space-y-3">
          <input
            placeholder="Business name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded text-sm"
          />
          <input
            placeholder="Business type (e.g. clothing, restaurant)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-line rounded text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded text-sm font-medium">
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-line rounded text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium text-accent"
        >
          <Plus size={16} /> New business
        </button>
      )}
    </div>
  );
}
