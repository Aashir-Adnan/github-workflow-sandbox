import { useState, useEffect } from "react";
import GithubWorkflowSandbox from "./components/GithubWorkflowSandbox";

const SANDBOX_USER = {
  uid: "sandbox-001",
  email: "intern@granjur.com",
  name: "Sandbox User",
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
        <span className="sandbox-title">GitHub Workflow Sandbox</span>
        <div className="sandbox-header-right">
          <span className="sandbox-user">
            Signed in as <strong>{SANDBOX_USER.name}</strong>
            <span className="sandbox-badge">sandbox</span>
          </span>
          <button
            type="button"
            className="sandbox-theme-toggle"
            onClick={() => setDark((d) => !d)}
            title="Toggle theme"
          >
            {dark ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="sandbox-main">
        <GithubWorkflowSandbox user={SANDBOX_USER} />
      </main>
    </div>
  );
}
