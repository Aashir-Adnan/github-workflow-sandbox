import { useState, useRef, useEffect } from "react";

import pkg from "../../package.json";

function IconGear({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function SettingsDropdown({ dark, setDark }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTheme = (isDark) => {
    setDark(isDark);
    setOpen(false); // close after selecting a theme
  };

  return (
    <div className="gh-settings-dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className="sandbox-settings-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconGear size={20} />
      </button>

      <div
        className={`gh-settings-dropdown${open ? " gh-settings-dropdown--open" : ""}`}
        role="menu"
      >
        <div className="gh-settings-dropdown-title">
          <span aria-hidden="true">⚙</span> Settings
        </div>

        <div className="gh-settings-dropdown-section">
          <span className="gh-settings-dropdown-label">Theme</span>
          <div className="gh-settings-theme-row">
            <button
              type="button"
              className={!dark ? "active" : ""}
              onClick={() => selectTheme(false)}
            >
              ☀ Light
            </button>
            <button
              type="button"
              className={dark ? "active" : ""}
              onClick={() => selectTheme(true)}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <div className="gh-settings-dropdown-divider" />

        <div className="gh-settings-dropdown-section gh-settings-dropdown-version">
          <span className="gh-settings-dropdown-label">Version</span>
          <span className="gh-settings-dropdown-value">v{pkg.version}</span>
        </div>
      </div>
    </div>
  );
}
