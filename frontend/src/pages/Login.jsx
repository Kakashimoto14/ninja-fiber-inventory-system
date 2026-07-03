import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Crown, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { roleLabel } from "../data/taskConfig.js";

export default function Login() {
  const { account, accounts, signIn } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (account) {
    return <Navigate to="/app" replace />;
  }

  const submitLogin = (event) => {
    event.preventDefault();
    const ok = signIn(selectedAccountId, password);

    if (!ok) {
      setError("Invalid password. Default password is 1234 until changed.");
    }
  };

  return (
    <div className="min-h-screen bg-soft px-4 py-8 text-slate-950">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-primary text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold text-slate-950">Ninja Fiber Inventory</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Choose an admin or superadmin account to continue.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {accounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAccountId(item.id);
                  setError("");
                }}
                className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-teal/30 ${
                  selectedAccountId === item.id ? "border-teal ring-2 ring-teal/20" : "border-slate-200"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-teal/10 text-teal">
                  {item.role === "superadmin" ? <Crown className="h-6 w-6" /> : <UserRoundCheck className="h-6 w-6" />}
                </div>
                <p className="mt-5 text-xl font-extrabold text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{roleLabel(item.role)} Account</p>
              </button>
            ))}
          </div>

          <form onSubmit={submitLogin} className="mx-auto mt-8 max-w-md space-y-3">
            <label className="block space-y-1.5">
              <span className="label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter password"
              />
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              Log In
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
