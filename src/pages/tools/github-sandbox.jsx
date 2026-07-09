import React from 'react';
import Layout from '@theme/Layout';
import GithubWorkflowSandbox from '@site/src/components/portal/GithubWorkflowSandbox';

const SANDBOX_USER = {
  uid: 'sandbox-001',
  email: 'intern@granjur.com',
  name: 'Sandbox User',
  photoURL: null,
};

export default function GithubSandboxPage() {
  return (
    <Layout
      title="GitHub Workflow Sandbox"
      description="Sandbox version of the GitHub Development Workflow — no auth or env required"
    >
      <main className="portal-main-wrapper">
        <GithubWorkflowSandbox user={SANDBOX_USER} />
      </main>
    </Layout>
  );
}
