export const adminAccounts = [
  { id: "rhea", name: "RHEA", role: "admin", disabled: false, password: "1234" },
  { id: "jules", name: "JULES", role: "admin", disabled: false, password: "1234" },
  { id: "jun", name: "JUN", role: "admin", disabled: false, password: "1234" }
];

export const superadminAccount = {
  id: "superadmin",
  name: "SUPERADMIN",
  role: "superadmin",
  disabled: false,
  password: "1234"
};

export const allAccounts = [...adminAccounts, superadminAccount];

export const taskTypes = ["Install", "Reactivate", "Repairs"];

export const taskStatusesByType = {
  Install: ["Pending", "Scheduled", "In Progress", "Completed"],
  Reactivate: ["Pending", "Verification", "In Progress", "Completed"],
  Repairs: ["Pending", "Diagnosing", "In Progress", "Completed"]
};

export const taskPriorities = ["Low", "Medium", "High", "Urgent"];

export const protectedResetStatuses = ["Completed", "In Progress"];

export const roleLabel = (role) => (role === "superadmin" ? "Superadmin" : "Admin");
