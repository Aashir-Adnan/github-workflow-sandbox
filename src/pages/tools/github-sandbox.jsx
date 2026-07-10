import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import GithubWorkflowSandbox from "@site/src/components/portal/GithubWorkflowSandbox";
import SettingsDropdown from "@site/src/components/SettingsDropdown";

const SANDBOX_USER = {
  uid: "sandbox-001",
  email: "intern@granjur.com",
  name: "Sandbox User ",
  photoURL: null,
};

function SandboxContent() {
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
    <>
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

      <section className="portal-section">
        <GithubWorkflowSandbox user={SANDBOX_USER} />
      </section>
    </>
  );
}

export default function GithubSandboxPage() {
  return (
    <Layout
      title="GitHub Workflow Sandbox"
      description="Sandbox version of the GitHub Development Workflow — no auth or env required"
      noNavbar
      noFooter
    >
      <main className="portal-main-wrapper">
        <SandboxContent />
      </main>
    </Layout>
  );
}
