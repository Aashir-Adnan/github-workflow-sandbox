# GitHub Workflow Sandbox

Standalone evaluation module — runs entirely on mock data with no backend, API keys, or `.env` file required.

## Setup

```bash
npm install
npm start
```

Opens at `http://localhost:3000` and redirects to the sandbox page.

## What's inside

- **Repo selector** — pick from 4 mock repositories
- **Issue list** — pre-seeded issues in various stages (awaiting bot, awaiting human, PR ready)
- **Issue creation** — full form with title, task, file explorer context, type, priority
- **Comment thread** — expandable comments with bot/human markers
- **Reply flow** — post `!discuss` / `!continue` replies; a simulated bot responds ~3s later
- **Pull Requests** — open/closed/draft PRs with changed file diffs and ping-to-merge
- **Notifications** — bell + floating toast when the mock bot replies

All data lives in memory — nothing persists across refreshes.

## File structure

```
src/
  components/portal/
    mockGithubData.js          ← mock API layer (edit this to change seed data)
    GithubWorkflowSandbox.jsx  ← the full UI component
  pages/tools/
    github-sandbox.jsx         ← page wrapper
  css/
    custom.css                 ← extracted styles
```
