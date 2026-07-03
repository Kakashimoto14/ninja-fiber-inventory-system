import { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";

const emptyEmployee = {
  fullName: "",
  position: "",
  dailyRate: 0,
  status: "Active",
  notes: ""
};

export default function EmployeeModal({ employee, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyEmployee);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(employee ? { ...emptyEmployee, ...employee } : emptyEmployee);
    setError("");
  }, [employee]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.position.trim()) {
      setError("Full name and position are required.");
      return;
    }

    if (Number(form.dailyRate) < 0) {
      setError("Daily rate cannot be negative.");
      return;
    }

    setError("");
    await onSave({
      ...form,
      dailyRate: Number(form.dailyRate)
    });
  };

  return (
    <Modal title={employee ? "Edit Employee" : "Add Employee"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="label">Full Name</span>
          <input
            className="input"
            required
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="label">Position</span>
          <input
            className="input"
            required
            value={form.position}
            onChange={(event) => updateField("position", event.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="label">Daily Rate</span>
          <input
            className="input"
            min="0"
            step="0.01"
            type="number"
            value={form.dailyRate}
            onChange={(event) => updateField("dailyRate", event.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="label">Status</span>
          <select className="input" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="label">Notes</span>
          <textarea
            className="input min-h-24 resize-y"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </label>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
