import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Layers, Trash2, Lock } from "lucide-react";
import { api } from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

export default function DashboardPage() {
  const { businessId } = useParams();
  const [modules, setModules] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  async function refresh() {
    const [mods, usageData] = await Promise.all([api.listModules(businessId), api.getUsage(businessId)]);
    setModules(mods);
    setUsage(usageData);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [businessId]);

  const atModuleLimit =
    usage && usage.tierConfig.moduleLimit !== null && modules.length >= usage.tierConfig.moduleLimit;

  return (
    <AppShell>
      <div className="px-8 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl text-ink">Dashboard</h1>
          <button
            onClick={() => setShowBuilder((s) => !s)}
            disabled={atModuleLimit && !showBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded text-sm font-medium disabled:opacity-40"
          >
            <Plus size={15} /> {showBuilder ? "Close builder" : "Add module"}
          </button>
        </div>
        {usage && (
          <p className="text-sm text-muted mb-6">
            <span className="font-mono">
              {modules.length}
              {usage.tierConfig.moduleLimit ? `/${usage.tierConfig.moduleLimit}` : ""}
            </span>{" "}
            modules used on your {usage.tierConfig.label} plan
          </p>
        )}

        {atModuleLimit && !showBuilder && (
          <div className="flex items-start gap-3 bg-panel border border-line rounded p-4 mb-4 text-sm">
            <Lock size={16} className="text-muted mt-0.5" />
            <div>
              <p className="text-ink font-medium">You've reached your module limit.</p>
              <Link to={`/business/${businessId}/billing`} className="text-accent font-medium">
                Upgrade your plan to add more →
              </Link>
            </div>
          </div>
        )}

        {showBuilder && <ModuleBuilder businessId={businessId} onCreated={refresh} />}

        {loading ? (
          <p className="text-sm text-muted mt-6">Loading...</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-muted mt-6">
            No modules yet. Add one above, or use the AI setup flow to get recommendations.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-6">
            {modules.map((m) => (
              <ModuleCard key={m.id} module={m} businessId={businessId} onChanged={refresh} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ModuleCard({ module, businessId, onChanged }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    api.listRecords(module.id).then((r) => setCount(r.length));
  }, [module.id]);

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete module "${module.name}"? This removes all its records.`)) return;
    await api.deleteModule(module.id);
    onChanged();
  }

  return (
    <Link
      to={`/business/${businessId}/module/${module.id}`}
      className="bg-panel border border-line rounded p-4 hover:border-accent block relative group"
    >
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 text-muted hover:text-red-600 opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
      <Layers size={18} className="text-accent mb-2" />
      <p className="text-sm font-medium text-ink">{module.name}</p>
      <p className="text-xs text-muted mt-0.5 font-mono">
        {module.fields.length} field{module.fields.length !== 1 ? "s" : ""} · {count === null ? "..." : count} record
        {count !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}

function ModuleBuilder({ businessId, onCreated }) {
  const [moduleName, setModuleName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.createModule(businessId, moduleName);
      setModuleName("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="bg-panel border border-line rounded p-4 mb-4 flex gap-2">
      <input
        placeholder="Module name (e.g. Inventory)"
        required
        value={moduleName}
        onChange={(e) => setModuleName(e.target.value)}
        className="flex-1 px-3 py-2 border border-line rounded text-sm"
      />
      <button
        type="submit"
        disabled={creating}
        className="px-4 py-2 bg-accent text-white rounded text-sm font-medium disabled:opacity-50"
      >
        Create
      </button>
      {error && <p className="text-sm text-red-600 self-center">{error}</p>}
    </form>
  );
}
