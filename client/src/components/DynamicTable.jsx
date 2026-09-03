import { Pencil, Trash2 } from "lucide-react";

// Renders a records table for ANY module purely from its fields + records.
// Pairs with DynamicForm to complete the generic CRUD engine.
export default function DynamicTable({ fields, records, onEdit, onDelete }) {
  if (fields.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">No fields defined for this module yet.</p>;
  }
  if (records.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">No records yet. Add your first one above.</p>;
  }

  return (
    <div className="overflow-x-auto border border-line rounded">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-accentSoft text-left">
            {fields.map((f) => (
              <th key={f.id || f.name} className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">
                {f.label}
              </th>
            ))}
            <th className="px-4 py-2.5 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-line hover:bg-accentSoft/40">
              {fields.map((f) => (
                <td
                  key={f.id || f.name}
                  className={`px-4 py-2.5 whitespace-nowrap ${f.type === "number" ? "font-mono" : ""}`}
                >
                  {formatValue(r.data[f.name], f.type)}
                </td>
              ))}
              <td className="px-4 py-2.5">
                <div className="flex gap-2 justify-end">
                  <button onClick={() => onEdit(r)} className="text-muted hover:text-accent">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => onDelete(r)} className="text-muted hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === "") return <span className="text-muted">—</span>;
  if (type === "boolean") return value ? "Yes" : "No";
  return String(value);
}
