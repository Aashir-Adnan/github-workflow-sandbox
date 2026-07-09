import { useState, useEffect } from 'react';
import { FileExplorer } from './GithubWorkflowSandbox';

export default function AppSidebar({
  user,
  view,
  onNavigate,
  onLogout,
  collapsed,
  onToggleCollapse,
  repos = [],
  reposLoading = false,
  reposError = null,
  selectedRepo,
  onSelectRepo,
  onBackToRepos,
}) {
  const [reposOpen, setReposOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(new Set());

  // Whenever a repo becomes selected, automatically expand its file-tree
  // preview in the sidebar so the user can see the files without an extra
  // click. Repos that aren't selected are left as-is (collapsed by default).
 useEffect(() => {
  if (!selectedRepo) {
    // Dashboard ya Settings → sab previews close
    setPreviewOpen(new Set());
    return;
  }

  // Sirf selected repo open rahe
  setPreviewOpen(new Set([selectedRepo.slug]));
}, [selectedRepo]);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const togglePreview = (slug) => {
    setPreviewOpen((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const handleSelectRepo = (repo) => {
    onNavigate('repos');
    onSelectRepo?.(repo);
  };

  return (
    <aside className={`app-sidebar${collapsed ? ' app-sidebar--collapsed' : ''}`}>
      <div className="app-sidebar-top">
        <div className="app-sidebar-mark" title="Workflow Sandbox">⎇</div>
        <button
          type="button"
          className="app-sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="app-sidebar-nav">
        <div className="app-sidebar-repos-block">
          <button
            type="button"
            className={`app-sidebar-item app-sidebar-repos-toggle${view === 'repos' && !selectedRepo ? ' app-sidebar-item--active' : ''}`}
            onClick={() => {
  onBackToRepos?.();      // previous repo clear
  onNavigate('repos');    // repositories dashboard
  setReposOpen((v) => !v);
}}
            title="Repositories"
          >
            <span className={`app-sidebar-repos-arrow${reposOpen ? ' app-sidebar-repos-arrow--open' : ''}`}>▶</span>
            <span className="app-sidebar-icon">📦</span>
            <span className="app-sidebar-label">Repositories</span>
          </button>

          {reposOpen && (
            <div className="app-sidebar-repos-list">
              {reposLoading && <p className="app-sidebar-repos-status">Loading…</p>}
              {reposError && (
                <p className="app-sidebar-repos-status app-sidebar-repos-status--error">{reposError}</p>
              )}
              {!reposLoading && !reposError && repos.map((r) => {
                const isPreviewOpen = previewOpen.has(r.slug);
                const isActive =
  view === 'repos' && selectedRepo?.slug === r.slug;
                return (
                  <div key={r.slug} className="app-sidebar-repo-entry">
                    <div className={`app-sidebar-repo-row${isActive ? ' app-sidebar-repo-row--active' : ''}`}>
                      <button
                        type="button"
                        className={`app-sidebar-repo-preview-btn${isPreviewOpen ? ' app-sidebar-repo-preview-btn--open' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreview(r.slug);
                        }}
                        aria-label={isPreviewOpen ? 'Hide files preview' : 'Preview files'}
                        aria-expanded={isPreviewOpen}
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        className="app-sidebar-repo-name-btn"
                        onClick={() => handleSelectRepo(r)}
                        title={`${r.owner}/${r.repo}`}
                      >
                        {r.name}
                      </button>
                    </div>
                    {isPreviewOpen && (
                      <div className="app-sidebar-repo-preview-tree">
                        <FileExplorer owner={r.owner} repo={r.repo} readOnly />
                      </div>
                    )}
                  </div>
                );
              })}
              {!reposLoading && !reposError && repos.length === 0 && (
                <p className="app-sidebar-repos-status">No repositories</p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`app-sidebar-item${view === 'settings' ? ' app-sidebar-item--active' : ''}`}
          onClick={() => {
  onBackToRepos?.();      // selected repo clear
  onNavigate('settings'); // settings open
}}
          title="Settings"
        >
          <span className="app-sidebar-icon">⚙️</span>
          <span className="app-sidebar-label">Settings</span>
        </button>
      </nav>

      <div className="app-sidebar-footer">
        <button
          type="button"
          className={`app-sidebar-account${view === 'settings' ? ' app-sidebar-item--active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Account settings"
        >
          <span className="app-sidebar-avatar">{initials}</span>
          <span className="app-sidebar-account-info">
            <span className="app-sidebar-account-name">{user?.name}</span>
            <span className="app-sidebar-account-email">{user?.email}</span>
          </span>
        </button>
        <button type="button" className="app-sidebar-logout" onClick={onLogout} title="Log out">
          ↩
        </button>
      </div>
    </aside>
  );
}
