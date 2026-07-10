import { useState } from 'react';

const PRONOUN_OPTIONS = [
  { value: '', label: "Don't specify" },
  { value: 'he/him', label: 'He/Him' },
  { value: 'she/her', label: 'She/Her' },
  { value: 'they/them', label: 'They/Them' },
  { value: 'custom', label: 'Custom' },
];

function ProfileEditForm({ user, onSave, onCancel }) {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [company, setCompany] = useState(user?.company || '');
  const [location, setLocation] = useState(user?.location || '');
  const [showLocalTime, setShowLocalTime] = useState(Boolean(user?.showLocalTime));
  const [website, setWebsite] = useState(user?.website || '');
  const [socialLinks, setSocialLinks] = useState(
    user?.socialLinks?.length === 4 ? user.socialLinks : ['', '', '', ''],
  );

  const handleSocialChange = (index, value) => {
    setSocialLinks((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: name.trim() || user?.name,
      bio: bio.trim(),
      pronouns,
      company: company.trim(),
      location: location.trim(),
      showLocalTime,
      website: website.trim(),
      socialLinks,
    });
  };

  return (
    <form className="settings-edit-profile-form" onSubmit={handleSubmit}>
      <label className="settings-field">
        <span className="settings-field-label">Name</span>
        <input
          type="text"
          className="settings-field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="settings-field">
        <span className="settings-field-label">Bio</span>
        <textarea
          className="settings-field-textarea"
          rows={3}
          placeholder="Add a bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <span className="settings-field-hint">
          You can @mention other users and organizations to link to them.
        </span>
      </label>

      <label className="settings-field">
        <span className="settings-field-label">Pronouns</span>
        <select
          className="settings-field-select"
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
        >
          {PRONOUN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      <div className="settings-edit-actions">
        <button type="submit" className="settings-save-btn">Save</button>
        <button type="button" className="settings-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <span className="settings-row-label">{label}</span>
        {description && <span className="settings-row-desc">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`settings-toggle${checked ? ' settings-toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'system', label: 'System', icon: '🖥️' },
];

export default function SettingsPage({
  user,
  theme,
  onSetTheme,
  compact,
  onSetCompact,
  onLogout,
  onUpdateProfile
}) {
  
  const [editingProfile, setEditingProfile] = useState(false);

  const handleSaveProfile = (updates) => {
    onUpdateProfile?.(updates);
    setEditingProfile(false);
  };

  return (
    <div className="settings-page">
      <h2 className="settings-heading">Account settings</h2>

      <section className="settings-section">
        <div className="settings-section-header-row">
          <h3 className="settings-section-title">Profile</h3>
          {!editingProfile && (
            <button
              type="button"
              className="settings-edit-profile-btn"
              onClick={() => setEditingProfile(true)}
            >
              Edit profile
            </button>
          )}
        </div>

        {editingProfile ? (
          <ProfileEditForm
            user={user}
            onSave={handleSaveProfile}
            onCancel={() => setEditingProfile(false)}
          />
        ) : (
          <div className="settings-profile-row">
            <div className="settings-avatar-lg">
              {(user?.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="settings-profile-info">
              <span className="settings-profile-name">
                {user?.name}
                {user?.pronouns && user.pronouns !== 'custom' && (
                  <span className="settings-profile-pronouns"> · {user.pronouns}</span>
                )}
              </span>
              <span className="settings-profile-email">{user?.email}</span>
              {user?.bio && <span className="settings-profile-bio">{user.bio}</span>}
              {(user?.company || user?.location) && (
                <span className="settings-profile-meta">
                  {[user?.company, user?.location].filter(Boolean).join(' · ')}
                </span>
              )}
              {user?.website && (
                <a className="settings-profile-website" href={user.website} target="_blank" rel="noreferrer">
                  {user.website}
                </a>
              )}
              <span className="sandbox-badge">sandbox</span>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-theme-row">
          <span className="settings-row-label">Theme</span>
          <div className="settings-segmented">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`settings-segmented-btn${theme === opt.id ? ' settings-segmented-btn--active' : ''}`}
                onClick={() => onSetTheme(opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Display</h3>
        <ToggleRow
  label="Compact Mode"
  description="Show more content per screen with tighter spacing"
  checked={compact}
  onChange={onSetCompact}
/>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Notifications</h3>
        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-label">Notification Preferences</span>
            <span className="settings-row-desc">Choose what you get notified about</span>
          </div>
          <button
  type="button"
  className="settings-manage-btn"
  onClick={() => {
    console.log("Manage clicked");
    alert("Notification preferences coming soon");
  }}
>
  Manage
</button>
        </div>
      </section>

      <section className="settings-section settings-section--danger">
        <button type="button" className="settings-logout-btn" onClick={onLogout}>
          Log out
        </button>
      </section>
    </div>
  );
}