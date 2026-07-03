import { useEffect, useState } from "react";
import Modal from "../common/Modal.jsx";
import { taskPriorities, taskStatusesByType, taskTypes } from "../../data/taskConfig.js";
import { toDateInputValue } from "../../utils/taskReset.js";

const emptyTask = {
  type: "Install",
  title: "",
  description: "",
  assigneeId: "",
  assigneeName: "",
  priority: "Medium",
  status: "Pending",
  date: toDateInputValue(),
  dueDate: "",
  notes: ""
};

const normalizeDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function TaskModal({ task, onClose, onSave, currentAccount, adminAccounts }) {
  const [form, setForm] = useState(emptyTask);

  useEffect(() => {
    const defaultAssignee =
      currentAccount?.role === "admin" ? currentAccount : adminAccounts[0] || currentAccount;

    setForm(
      task
        ? {
            ...emptyTask,
            ...task,
            date: normalizeDateInput(task.date),
            dueDate: normalizeDateInput(task.dueDate)
          }
        : {
            ...emptyTask,
            assigneeId: defaultAssignee?.id || "",
            assigneeName: defaultAssignee?.name || ""
          }
    );
  }, [adminAccounts, currentAccount, task]);

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "type" && !taskStatusesByType[value].includes(next.status)) {
        next.status = "Pending";
      }

      if (field === "assigneeId") {
        const assignee = adminAccounts.find((item) => item.id === value);
        next.assigneeName = assignee?.name || "";
      }

      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      date: form.date || toDateInputValue(),
      dueDate: form.dueDate || null
    });
  };

  return (
    <Modal title={task ? "Edit Task" : "Add Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="label">Task Type</span>
            <select className="input" value={form.type} onChange={(e) => updateField("type", e.target.value)}>
              {taskTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="label">Priority</span>
            <select className="input" value={form.priority} onChange={(e) => updateField("priority", e.target.value)}>
              {taskPriorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="label">Title</span>
          <input className="input" required value={form.title} onChange={(e) => updateField("title", e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="label">Description</span>
          <textarea className="input min-h-24 resize-y" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="label">Assignee</span>
            <select
              className="input"
              value={form.assigneeId}
              onChange={(e) => updateField("assigneeId", e.target.value)}
              disabled={currentAccount?.role !== "superadmin"}
            >
              {adminAccounts.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="label">Status</span>
            <select className="input" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              {taskStatusesByType[form.type].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="label">Task Date</span>
            <input className="input" type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="label">Deadline</span>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="label">Notes</span>
          <textarea className="input min-h-32 resize-y" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
