import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { allAccounts as defaultAccounts } from "../data/taskConfig.js";

export { adminAccounts, superadminAccount } from "../data/taskConfig.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [accountList, setAccountList] = useState(defaultAccounts);

  useEffect(() => {
    const savedAccounts = localStorage.getItem("nfi_accounts");
    const parsedAccounts = savedAccounts ? JSON.parse(savedAccounts) : defaultAccounts;
    const migratedAccounts = parsedAccounts.map((item) => {
      const defaultAccount = defaultAccounts.find((defaultItem) => defaultItem.id === item.id);
      return {
        ...item,
        password: item.password || defaultAccount?.password || "1234"
      };
    });
    const withMissingDefaults = [
      ...migratedAccounts,
      ...defaultAccounts.filter(
        (defaultAccount) => !migratedAccounts.some((item) => item.id === defaultAccount.id)
      )
    ];
    const savedAccountId = localStorage.getItem("nfi_admin_account");
    const savedAccount = withMissingDefaults.find((item) => item.id === savedAccountId && !item.disabled);

    setAccountList(withMissingDefaults);
    localStorage.setItem("nfi_accounts", JSON.stringify(withMissingDefaults));
    if (savedAccount) {
      setAccount(savedAccount);
    }
  }, []);

  const persistAccounts = (nextAccounts) => {
    setAccountList(nextAccounts);
    localStorage.setItem("nfi_accounts", JSON.stringify(nextAccounts));
  };

  const value = useMemo(
    () => ({
      account,
      accounts: accountList.filter((item) => !item.disabled),
      allAccounts: accountList,
      adminAccounts: accountList.filter((item) => item.role === "admin" && !item.disabled),
      signIn: (accountId, password) => {
        const selectedAccount = accountList.find((item) => item.id === accountId && !item.disabled);

        if (!selectedAccount || selectedAccount.password !== password) {
          return false;
        }

        localStorage.setItem("nfi_admin_account", selectedAccount.id);
        setAccount(selectedAccount);
        return true;
      },
      signOut: () => {
        localStorage.removeItem("nfi_admin_account");
        setAccount(null);
      },
      addAccount: (name) => {
        const normalizedName = name.trim().toUpperCase();

        if (!normalizedName) return;

        const nextAccount = {
          id: `${normalizedName.toLowerCase()}-${Date.now()}`,
          name: normalizedName,
          role: "admin",
          disabled: false,
          password: "1234"
        };

        persistAccounts([...accountList, nextAccount]);
      },
      updateAccount: (accountId, patch) => {
        const nextAccounts = accountList.map((item) =>
          item.id === accountId ? { ...item, ...patch } : item
        );
        persistAccounts(nextAccounts);

        if (account?.id === accountId) {
          setAccount(nextAccounts.find((item) => item.id === accountId) || null);
        }
      },
      removeAccount: (accountId) => {
        const nextAccounts = accountList.filter((item) => item.id !== accountId);
        persistAccounts(nextAccounts);

        if (account?.id === accountId) {
          localStorage.removeItem("nfi_admin_account");
          setAccount(null);
        }
      },
      changePassword: (accountId, currentPassword, nextPassword) => {
        const selectedAccount = accountList.find((item) => item.id === accountId);

        if (!selectedAccount || selectedAccount.password !== currentPassword || !nextPassword.trim()) {
          return false;
        }

        const nextAccounts = accountList.map((item) =>
          item.id === accountId ? { ...item, password: nextPassword } : item
        );
        persistAccounts(nextAccounts);

        if (account?.id === accountId) {
          setAccount(nextAccounts.find((item) => item.id === accountId));
        }

        return true;
      }
    }),
    [account, accountList]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
