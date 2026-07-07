# Sandbox Fixes Summary

This file tracks the fixes and UX updates completed in the GitHub Workflow Sandbox.

## 1. Issue Reply Validation (`!discuss`)

- Prevented empty discussion messages from being submitted.
- Added inline guidance under the textarea when discuss is selected and empty:
  - `Add a description so the agent knows what to change.`
- Files:
  - `src/components/GithubWorkflowSandbox.jsx`
  - `src/styles.css`

## 2. Ping State Persistence in PR Row

- Updated ping state display to derive from fetched ping comments instead of click-only local `sent` state.
- Added eager ping fetch on mount so the PR row reflects existing ping status immediately.
- Kept `pingStatus` for transient states only (`sending` / `error`).
- File:
  - `src/components/GithubWorkflowSandbox.jsx`

## 3. Ping Delete Persistence (Mock Backend)

- Fixed mock DELETE handler for comments to actually remove comment entries from `_commentStore`.
- Prevents deleted ping comments from reappearing after refresh/refetch.
- File:
  - `src/components/mockGithubData.js`

## 4. Ping to Merge Confirmation Modal

- Added/used a confirmation modal before posting a merge ping on a PR.
- Prevents accidental ping sends and gives explicit user confirmation.
- File:
  - `src/components/GithubWorkflowSandbox.jsx`

## 5. Issue Status Light Color Mapping

- Fixed status light colors so states are visually distinct:
  - `ok` (awaiting bot): blue
  - `alert` (awaiting human): amber
  - `done` (PR ready/closed): green
- Applied in both light and dark theme overrides.
- File:
  - `src/styles.css`

## 6. UI/UX Clarity Improvements (CSS)

- Improved visual hierarchy (titles/labels readability).
- Improved spacing and panel/card structure.
- Improved empty/loading/error state presentation.
- File:
  - `src/styles.css`
