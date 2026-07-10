import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Sandbox login — no real backend, just simulate a short delay.
    setTimeout(() => {
      const userEmail = email || 'intern@granjur.com';

onLogin({
  uid: 'sandbox-001',
  email: userEmail,
  name: userEmail.split('@')[0],
  photoURL: null,
});
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark">⎇</div>
        <h1 className="login-title">Sign in to Workflow Sandbox</h1>
        <p className="login-subtitle">Use your workspace email to continue</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-label">Email address</span>
            <input
              type="email"
              className="login-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </label>

          <label className="login-field">
            <span className="login-label">Password</span>
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-footnote">Sandbox environment — any email/password works.</p>
      </div>
    </div>
  );
}
