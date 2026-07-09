import React, { useState } from 'react';
import { useHistory } from '@docusaurus/router';
import { REPOS } from './mockGithubData';
import '../../css/repository-home.css';

function RepositoryCard({ repo, onCardHover, hoveredId, onRepoClick }) {
  const isHovered = hoveredId === repo.id;

  return (
    <div
      className={`repo-card ${isHovered ? 'repo-card--hovered' : ''}`}
      onMouseEnter={() => onCardHover(repo.id)}
      onMouseLeave={() => onCardHover(null)}
      onClick={() => onRepoClick(repo)}
      style={{ '--card-primary-color': repo.primaryColor, cursor: 'pointer' }}
    >
      <div className="repo-card-header">
        <div className="repo-card-icon-wrapper">
          <div className="repo-card-icon" style={{ backgroundColor: `${repo.primaryColor}15`, borderColor: `${repo.primaryColor}33` }}>
            <span className="repo-icon-emoji">{repo.icon}</span>
          </div>
          <div className="repo-card-info">
            <h3 className="repo-name">{repo.name}</h3>
            <p className="repo-slug">{repo.owner}/{repo.repo}</p>
          </div>
        </div>
        <span className="repo-visibility-badge">{repo.visibility}</span>
      </div>

      <p className="repo-description">{repo.description}</p>

      <div className="repo-card-footer">
        <div className="repo-meta">
          <div className="repo-language">
            <div className="language-dot" style={{ backgroundColor: repo.languageColor }}></div>
            <span className="language-name">{repo.language}</span>
          </div>
          <div className="repo-stats">
            {repo.stars && (
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{repo.stars}</span>
              </div>
            )}
            {repo.version && (
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-value">{repo.version}</span>
              </div>
            )}
            {repo.viewers && (
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{repo.viewers} viewers</span>
              </div>
            )}
            {repo.lastUpdate && (
              <div className="stat-item">
                <span className="stat-icon">🕐</span>
                <span className="stat-value">{repo.lastUpdate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateRepositoryCard({ onCreateClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`repo-card repo-card--create ${isHovered ? 'repo-card--hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onCreateClick}
    >
      <div className="create-repo-content">
        <div className="create-repo-circle">
          <span className="create-icon">+</span>
        </div>
        <span className="create-repo-text">Create New Repository</span>
      </div>
    </div>
  );
}

export default function RepositoryHome() {
  const [hoveredId, setHoveredId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [repos, setRepos] = useState(REPOS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRepo, setNewRepo] = useState({
    owner: 'granjur',
    name: '',
    repo: '',
    description: '',
    visibility: 'Public',
    language: 'TypeScript',
    icon: '📦',
    primaryColor: '#67df70',
  });
  const [formError, setFormError] = useState('');
  const history = useHistory();

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRepoClick = (repo) => {
    // Navigate to the GitHub sandbox page with the selected repository
    // Store full repo data in sessionStorage to pass to sandbox
    sessionStorage.setItem('selectedRepo', JSON.stringify(repo));
    history.push('/tools/github-sandbox');
  };

  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const resetForm = () => {
    setFormError('');
    setNewRepo({
      owner: 'granjur',
      name: '',
      repo: '',
      description: '',
      visibility: 'Public',
      language: 'TypeScript',
      icon: '📦',
      primaryColor: '#67df70',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    const name = newRepo.name.trim();
    const repoName = newRepo.repo.trim() || slugify(name);

    if (!name) {
      setFormError('Repository name is required.');
      return;
    }

    if (!repoName) {
      setFormError('Repository slug cannot be empty.');
      return;
    }

    const nextId = Math.max(0, ...repos.map((item) => item.id)) + 1;

    const createdRepo = {
      ...newRepo,
      id: nextId,
      name,
      repo: repoName,
      slug: repoName,
      lastUpdate: 'just now',
      stars: 0,
      viewers: 0,
      pendingCommits: 0,
    };

    setRepos([createdRepo, ...repos]);
    closeCreateModal();
  };

  const handleFieldChange = (field, value) => {
    setNewRepo((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="repository-home-wrapper">
      {/* Top App Bar */}
      <header className="top-app-bar">
        <div className="top-bar-content">
          <div className="top-bar-start">
            <div className="user-avatar">
              <img
                alt="User Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9xkToWv8FqqXUTCJ65eNl8gGvZ0ijVfICVW-CRvVSXjG-73l2XQV9iVpeFGk45CvQoPVaNmI2kOvJYdO7XiNnJFWKomZibQ8O4mN8dixHt6hAKOb8F1g4chpbO1vxpWqWmMpRyx6rpoJk59Fc5ibKMfyGWXvJIkQMPq9LXljMFP5GvfEj-Vn4VP4Q9x-CuaV7ZAt_sitp12sx88taIqYfZubKY2bt7g7mvBnISeeFQ6Pbf10gfnoa5A"
                alt="user"
              />
            </div>
            <h1 className="top-bar-title">GitHub Workflow</h1>
          </div>
          <nav className="top-bar-nav">
            <a href="#" className="nav-link active">
              <span className="nav-icon">📋</span>
              Repositories
            </a>
          </nav>
          <div className="top-bar-actions">
            <button className="notification-btn">
              <span className="notification-icon">🔔</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search repositories, issues, pull requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-text">
            <h2 className="dashboard-title">Repositories</h2>
            <p className="dashboard-subtitle">Manage and track your software development lifecycle.</p>
          </div>
          <div className="header-actions">
            <div className="view-switcher">
              <button className="view-btn active" title="Grid view">
                <span className="view-icon">⊞</span>
              </button>
              <button className="view-btn" title="List view">
                <span className="view-icon">≡</span>
              </button>
            </div>
            <button className="new-repo-btn" onClick={openCreateModal}>
              <span className="btn-icon">+</span>
              New Repository
            </button>
          </div>
        </div>

        {/* Repository Grid */}
        <div className="repos-grid">
          {filteredRepos.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repo={repo}
              onCardHover={setHoveredId}
              hoveredId={hoveredId}
              onRepoClick={handleRepoClick}
            />
          ))}
          <CreateRepositoryCard onCreateClick={openCreateModal} />
        </div>

        {isCreateOpen && (
          <div className="repo-modal-overlay" role="dialog" aria-modal="true">
            <div className="repo-modal">
              <div className="repo-modal-header">
                <div>
                  <h3>Create repository</h3>
                  <p>Quickly add a new repository card to your sandbox list.</p>
                </div>
                <button className="repo-modal-close" onClick={closeCreateModal} aria-label="Close create repository">
                  ×
                </button>
              </div>
              <form className="repo-modal-form" onSubmit={handleCreateSubmit}>
                <div className="repo-modal-row">
                  <label className="repo-modal-label">Repository name</label>
                  <input
                    className="repo-modal-input"
                    value={newRepo.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Example: Bank API"
                    autoFocus
                  />
                </div>
                <div className="repo-modal-row">
                  <label className="repo-modal-label">Repo slug</label>
                  <input
                    className="repo-modal-input"
                    value={newRepo.repo}
                    onChange={(e) => handleFieldChange('repo', e.target.value)}
                    placeholder="Example: bank-api"
                  />
                </div>
                <div className="repo-modal-row">
                  <label className="repo-modal-label">Description</label>
                  <textarea
                    className="repo-modal-textarea"
                    rows={3}
                    value={newRepo.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Short description for the repository"
                  />
                </div>
                <div className="repo-modal-row repo-modal-grid">
                  <div>
                    <label className="repo-modal-label">Visibility</label>
                    <select
                      className="repo-modal-input"
                      value={newRepo.visibility}
                      onChange={(e) => handleFieldChange('visibility', e.target.value)}
                    >
                      <option>Public</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="repo-modal-label">Language</label>
                    <input
                      className="repo-modal-input"
                      value={newRepo.language}
                      onChange={(e) => handleFieldChange('language', e.target.value)}
                    />
                  </div>
                </div>
                <div className="repo-modal-row repo-modal-grid">
                  <div>
                    <label className="repo-modal-label">Icon</label>
                    <input
                      className="repo-modal-input"
                      value={newRepo.icon}
                      onChange={(e) => handleFieldChange('icon', e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="repo-modal-label">Accent color</label>
                    <input
                      type="color"
                      className="repo-modal-input"
                      value={newRepo.primaryColor}
                      onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                    />
                  </div>
                </div>
                {formError && <p className="repo-modal-error">{formError}</p>}
                <div className="repo-modal-actions">
                  <button type="button" className="repo-modal-cancel" onClick={closeCreateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="repo-modal-submit">
                    Add repository
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRepos.length === 0 && (
          <div className="empty-state">
            <p>No repositories found</p>
            <p className="empty-state-hint">Try adjusting your search query</p>
          </div>
        )}
      </main>
    </div>
  );
}
