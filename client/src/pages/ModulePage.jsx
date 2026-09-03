import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { api } from "../api/client.js";
import DynamicForm from "../components/DynamicForm.jsx";
import DynamicTable from "../components/DynamicTable.jsx";
import AppShell from "../components/AppShell.jsx";

const FIELD_TYPES = ["text", "number", "date", "select", "boolean", "textarea"];

// Field errors from the API can be a normal validation message or a 402
// tier-limit message ("Your Silver plan allows up to 6 fields...") --
// both are just shown as-is since the API already writes them for humans.

export default function ModulePage() {
  const { businessId, moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [records, setRecords] = useState([]);
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const modules = await api.listModules(businessId);
    const mod = modules.find((m) => m.id === moduleId);
    setModule(mod || null);
    if (mod) {
      const recs = await api.listRecords(moduleId);
      setRecords(recs);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  if (loading)
    return (
      <AppShell>
        <div className="px-8 py-10 text-sm text-muted">Loading...</div>
      </AppShell>
    );
  if (!module)
    return (
      <AppShell>
        <div className="px-8 py-10 text-sm text-muted">Module not found.</div>
      </AppShell>
    );

  async function handleDeleteField(fieldId) {
    if (!confirm("Remove this field? Existing record data for it stays but won't be shown.")) return;
    await api.deleteField(fieldId);
    refresh();
  }

  async function handleCreateRecord(data) {
    await api.createRecord(moduleId, data);
    setShowRecordForm(false);
    refresh();
  }

  async function handleUpdateRecord(data) {
    await api.updateRecord(editingRecord.id, data);
    setEditingRecord(null);
    refresh();
  }

  async function handleDeleteRecord(record) {
    if (!confirm("Delete this record?")) return;
    await api.deleteRecord(record.id);
    refresh();
  }

  return (
    <AppShell>
    <div className="px-8 py-10 max-w-3xl">
      <Link to={`/business/${businessId}/dashboard`} className="text-sm text-muted hover:text-ink mb-4 inline-block">
        ← Dashboard
      </Link>

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl text-ink">{module.name}</h1>
        <button
          onClick={() => setShowFieldBuilder((s) => !s)}
          className="text-sm text-accent font-medium"
        >
          {showFieldBuilder ? "Done editing fields" : "Edit fields"}
        </button>
      </div>
      <p className="text-sm text-muted mb-6">{module.fields.length} field{module.fields.length !== 1 ? "s" : ""}</p>

      {showFieldBuilder && (
        <FieldBuilder moduleId={moduleId} fields={module.fields} onChanged={refresh} onDeleteField={handleDeleteField} />
      )}

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-sm font-medium text-ink">Records</h2>
        {!showRecordForm && (
          <button
            onClick={() => setShowRecordForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded text-sm font-medium"
          >
            <Plus size={15} /> Add record
          </button>
        )}
      </div>

      {showRecordForm && (
        <div className="bg-panel border border-line rounded p-4 mb-4">
          <DynamicForm
            fields={module.fields}
            onSubmit={handleCreateRecord}
            onCancel={() => setShowRecordForm(false)}
            submitLabel="Add record"
          />
        </div>
      )}

      {editingRecord && (
        <div className="bg-panel border border-line rounded p-4 mb-4">
          <p className="text-sm font-medium text-ink mb-3">Edit record</p>
          <DynamicForm
            fields={module.fields}
            initialData={editingRecord.data}
            onSubmit={handleUpdateRecord}
            onCancel={() => setEditingRecord(null)}
            submitLabel="Save changes"
          />
        </div>
      )}

      <DynamicTable
        fields={module.fields}
        records={records}
        onEdit={setEditingRecord}
        onDelete={handleDeleteRecord}
      />
    </div>
    </AppShell>
  );
}

function FieldBuilder({ moduleId, fields, onChanged, onDeleteField }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const options = type === "select" ? optionsText.split(",").map((s) => s.trim()).filter(Boolean) : [];
      await api.addField(moduleId, { name, label, type, required, options });
      setName("");
      setLabel("");
      setType("text");
      setRequired(false);
      setOptionsText("");
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-panel border border-line rounded p-4 mb-4">
      <p className="text-sm font-medium text-ink mb-3">Fields</p>
      <div className="space-y-1 mb-4">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center justify-between text-sm py-1.5 border-t border-line first:border-t-0">
            <span className="text-ink">
              {f.label} <span className="text-xs text-muted">({f.name}, {f.type}{f.required ? ", required" : ""})</span>
            </span>
            <button onClick={() => onDeleteField(f.id)} className="text-muted hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2">
        <input
          placeholder="Field label (e.g. Phone Number)"
          required
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setName(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));
          }}
          className="px-3 py-2 border border-line rounded text-sm col-span-2"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border border-line rounded text-sm">
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted px-3">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>
        {type === "select" && (
          <input
            placeholder="Options, comma separated"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="px-3 py-2 border border-line rounded text-sm col-span-2"
          />
        )}
        {error && <p className="text-sm text-red-600 col-span-2">{error}</p>}
        <button type="submit" className="px-4 py-2 bg-accent text-white rounded text-sm font-medium col-span-2">
          Add field
        </button>
      </form>
    </div>
  );
}
