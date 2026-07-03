import { useState } from "react";
import { Database, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { roleLabel } from "../data/taskConfig.js";

export default function Settings() {
  const { account, allAccounts, addAccount, updateAccount, removeAccount, changePassword } = useAuth();
  const [newAdminName, setNewAdminName] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const adminAccounts = allAccounts.filter((item) => item.role === "admin");

  const createAdmin = (event) => {
    event.preventDefault();
    addAccount(newAdminName);
    setNewAdminName("");
  };

  const submitPasswordChange = (event) => {
    event.preventDefault();

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    const ok = changePassword(account.id, passwordForm.current, passwordForm.next);

    if (!ok) {
      setPasswordMessage("Current password is incorrect.");
      return;
    }

    setPasswordForm({ current: "", next: "", confirm: "" });
    setPasswordMessage("Password changed successfully.");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Settings</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Workspace Settings</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <UserRound className="h-6 w-6 text-primary" />
          <h2 className="mt-4 text-lg font-extrabold text-slate-950">Profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Signed in as {account.name} with {roleLabel(account.role)} access.
          </p>
        </section>
        <section className="card p-5">
          <KeyRound className="h-6 w-6 text-primary" />
          <h2 className="mt-4 text-lg font-extrabold text-slate-950">Role Access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Admins manage only their own tasks. Superadmin can view all tasks, calendars, reports, and accounts.
          </p>
        </section>
        <section className="card p-5">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="mt-4 text-lg font-extrabold text-slate-950">Daily Reset</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pending, Scheduled, Verification, and Diagnosing tasks reset to Pending at midnight. In Progress and Completed are protected.
          </p>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Admin Accounts</h2>
            <p className="mt-1 text-sm text-slate-500">
              {account.role === "superadmin" ? "Manage admin access for the task system." : "Visible admin accounts in the workspace."}
            </p>
          </div>

          {account.role === "superadmin" && (
            <form onSubmit={createAdmin} className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input min-w-56"
                value={newAdminName}
                onChange={(event) => setNewAdminName(event.target.value)}
                placeholder="New admin name"
              />
              <button type="submit" className="btn-primary">
                Add Admin
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {adminAccounts.map((admin) => (
            <div key={admin.id} className="rounded-lg border border-slate-200 bg-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-extrabold text-slate-950">{admin.name}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{roleLabel(admin.role)} Account</p>
                  {admin.disabled && <p className="mt-2 text-xs font-bold text-red-600">Disabled</p>}
                </div>
                <ShieldCheck className="h-5 w-5 text-teal" />
              </div>

              {account.role === "superadmin" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2"
                    onClick={() => updateAccount(admin.id, { disabled: !admin.disabled })}
                  >
                    {admin.disabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:text-red-600"
                    onClick={() => removeAccount(admin.id)}
                    aria-label={`Remove ${admin.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-extrabold text-slate-950">Change Password</h2>
        <form onSubmit={submitPasswordChange} className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="space-y-1.5">
            <span className="label">Current Password</span>
            <input
              className="input"
              type="password"
              value={passwordForm.current}
              onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5">
            <span className="label">New Password</span>
            <input
              className="input"
              type="password"
              value={passwordForm.next}
              onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5">
            <span className="label">Confirm Password</span>
            <input
              className="input"
              type="password"
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))}
            />
          </label>
          <div className="flex flex-col gap-3 lg:col-span-3 lg:flex-row lg:items-center">
            <button type="submit" className="btn-primary">
              Save Password
            </button>
            {passwordMessage && <p className="text-sm font-semibold text-slate-600">{passwordMessage}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
