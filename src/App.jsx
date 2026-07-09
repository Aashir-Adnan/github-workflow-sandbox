import { useState, useEffect } from "react";
import GithubWorkflowSandbox from "./components/GithubWorkflowSandbox";
import SettingsDropdown from "./components/SettingsDropdown";

const SANDBOX_USER = {
  uid: "sandbox-001",
  email: "intern@granjur.com",
  name: "Sandbox User ",
  photoURL: null,
};

export default function App() {
  const [dark, setDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
  }, [dark]);

  return (
    <div className="sandbox-shell">
      <header className="sandbox-header">
        <div className="sandbox-logo">
          <span className="logo-icon">⚡</span>
          <div>
            <h2>GitHub Workflow</h2>
            <p>Agent Dashboard</p>
          </div>
        </div>

        <div className="sandbox-header-right">
          <div className="sandbox-user">
            <div className="user-avatar">{SANDBOX_USER.name.charAt(0)}</div>

            <div>
              <strong>{SANDBOX_USER.name}</strong>
              <small>{SANDBOX_USER.email}</small>
            </div>
          </div>

          <SettingsDropdown dark={dark} setDark={setDark} />
        </div>
      </header>

      <main className="sandbox-main">
        <GithubWorkflowSandbox user={SANDBOX_USER} />
      </main>
    </div>
  );
}
