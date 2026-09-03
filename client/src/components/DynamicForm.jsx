import { useState } from "react";

// Renders an add/edit form for ANY module purely from its `fields` array.
// This one component replaces what would otherwise be a hand-coded form
// per module (CustomerForm, InventoryForm, etc.) -- the entire point of
// the metadata-driven approach.
export default function DynamicForm({ fields, initialData = {}, onSubmit, onCancel, submitLabel = "Save" }) {
  const [values, setValues] = useState(() => {
    const base = {};
    for (const f of fields) base[f.name] = initialData[f.name] ?? (f.type === "boolean" ? false : "");
    return base;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-muted">This module has no fields yet. Add fields in the ERP Builder first.</p>
      )}
      {fields.map((f) => (
        <div key={f.id || f.name}>
          <label className="block text-sm font-medium text-ink mb-1">
            {f.label}
            {f.required && <span className="text-accent"> *</span>}
          </label>
          {renderInput(f, values[f.name], (v) => update(f.name, v))}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-accent text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-line rounded text-sm font-medium text-muted hover:bg-accentSoft"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function renderInput(field, value, onChange) {
  const baseClass =
    "w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 bg-panel";

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          className={baseClass}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className={baseClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "date":
      return (
        <input
          type="date"
          className={baseClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      );
    case "select":
      return (
        <select
          className={baseClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          className={baseClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
  }
}
