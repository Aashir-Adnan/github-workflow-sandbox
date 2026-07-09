import { useState, useEffect } from 'react';
import GithubWorkflowSandbox from './components/GithubWorkflowSandbox';
import LoginPage from './components/LoginPage';
import AppSidebar from './components/AppSidebar';
import SettingsPage from './components/SettingsPage';
import { mockFetchTrackedRepos } from './components/mockGithubData';

export default function App() {
  const [compact, setCompact] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('gh-sandbox-theme') || 'system',
  );
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('gh-sandbox-sidebar-collapsed') === 'true',
  );
  const [user, setUser] = useState(null);
  const [view, setView] = useState('repos');

  // Repo list + selected repo live here so both AppSidebar (repo dropdown)
  // and GithubWorkflowSandbox (main workspace) share the same state.
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    mockFetchTrackedRepos()
      .then(setRepos)
      .catch((e) => setReposError(e.message))
      .finally(() => setReposLoading(false));
  }, []);

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setView('repos');
  };

  const handleBackToRepos = () => {
  setSelectedRepo(null);
  setView("repos");
};

  const handleUpdateProfile = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('gh-sandbox-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gh-sandbox-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div className={`app-shell ${compact ? 'compact-mode' : ''}`}>
      <AppSidebar
        user={user}
        view={view}
        onNavigate={setView}
        onLogout={() => setUser(null)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        repos={repos}
        reposLoading={reposLoading}
        reposError={reposError}
        selectedRepo={selectedRepo}
        onSelectRepo={handleSelectRepo}
        onBackToRepos={handleBackToRepos}
      />

      <div className="app-content-col">
        <header className="sandbox-header">
          <span className="sandbox-title">GitHub Workflow Sandbox</span>
         <div className="sandbox-header-right">
  <div className="sandbox-user">
    <div className="sandbox-avatar">
      {user?.name?.charAt(0).toUpperCase()}
    </div>

    <strong>{user.name}</strong>
  </div>
</div>
        </header>

        <main className="sandbox-main">
          {view === 'settings' ? (
            <SettingsPage
  user={user}
  theme={theme}
  onSetTheme={setTheme}
  compact={compact}
  onSetCompact={setCompact}
  onLogout={() => setUser(null)}
  onUpdateProfile={handleUpdateProfile}
/>
          ) : (
            <GithubWorkflowSandbox
              user={user}
              repos={repos}
              reposLoading={reposLoading}
              reposError={reposError}
              selectedRepo={selectedRepo}
              onSelectRepo={handleSelectRepo}
              onBack={handleBackToRepos}
            />
          )}
        </main>
      </div>
    </div>
  );
}