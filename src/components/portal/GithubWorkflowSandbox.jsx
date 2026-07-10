import React, { useEffect, useState } from 'react';
import { mockFetchTrackedRepos, mockGhFetch } from './mockGithubData';
import './GithubWorkflowSandbox.css';

/* ───────────────────────── helpers ───────────────────────── */

function parseAgentBody(body = '') {
  const get = (label) => {
    const re = new RegExp(label + ':\\n([\\s\\S]*?)(?:\\n\\n|$)');
    const m = body.match(re);
    return m ? m[1].trim() : '';
  };
  return {
    task: get('Task'),
    context: get('Context').split(',').map((s) => s.trim()).filter(Boolean),
    type: get('Type') || 'Code Writer',
    priority: get('Priority') || 'Normal',
    notifyEmail: get('NotifyEmail'),
  };
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = Math.round(diffMs / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function stageOf(issue, comments) {
  if (issue.state === 'closed') return 'done';
  if (!comments || comments.length === 0) return 'bot';
  return comments[comments.length - 1].user.type === 'Bot' ? 'human' : 'bot';
}

function stageLabel(s) {
  return { bot: 'Awaiting bot', human: 'Awaiting you', done: 'PR ready' }[s];
}

function priClass(p) {
  return { Immediate: 'pri-immediate', High: 'pri-high', Normal: 'pri-normal', Low: 'pri-low' }[p] || 'pri-normal';
}

function linkedPrNumber(comments = []) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const m = comments[i].body.match(/\/pull\/(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

function cleanTitle(title) {
  return title.replace('[Agent Call] ', '');
}

function stripEmoji(s = '') {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
}

/* ───────────────────────── small pieces ───────────────────────── */

function FileTree({ tree, highlightPaths, pickerMode, pickedPaths, onTogglePath }) {
  return (
    <div className="ghw-tree">
      {tree.map((n) => {
        const depth = n.path.split('/').length - 1;
        const isHit = highlightPaths && highlightPaths.includes(n.path);
        const isPicked = pickerMode && pickedPaths.includes(n.path);
        const icon = n.type === 'tree' ? '\uD83D\uDCC1' : '\uD83D\uDCC4';
        const isBlob = n.type === 'blob';
        const cls = isBlob
          ? `ghw-tree-row ghw-tree-blob ${pickerMode ? 'ghw-tree-picker-row' : ''} ${isPicked ? 'picked' : ''} ${isHit ? 'ghw-tree-hit' : ''}`
          : 'ghw-tree-row';
        return (
          <div
            key={n.path}
            className={cls}
            style={{ paddingLeft: 10 + depth * 16 }}
            onClick={isBlob && pickerMode ? () => onTogglePath(n.path) : undefined}
          >
            {pickerMode && isBlob && <span className="ghw-check" />}
            <span className="ghw-tree-icon">{icon}</span>
            <span className="ghw-mono">{n.path.split('/').pop()}</span>
          </div>
        );
      })}
    </div>
  );
}

function IssueCard({ issue, comments, selected, onClick }) {
  const stage = stageOf(issue, comments);
  const parsed = parseAgentBody(issue.body);
  const mine = issue.user.login === 'sandbox-user';
  return (
    <button className={`ghw-fcard ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="ghw-fcard-top">
        <span className="ghw-fcard-num ghw-mono">#{issue.number}</span>
        <span className="ghw-fcard-age">{timeAgo(issue.created_at)}</span>
      </div>
      <span className="ghw-fcard-title">{cleanTitle(issue.title)}</span>
      <div className="ghw-fcard-badges">
        {mine && <span className="ghw-chip mine">you</span>}
        <span className={`ghw-chip stage-${stage}`}>{stageLabel(stage)}</span>
        <span className={`ghw-chip ${priClass(parsed.priority)}`}>{parsed.priority}</span>
      </div>
    </button>
  );
}

function PrCard({ pr, selected, onClick }) {
  let badge;
  if (pr.state === 'closed') badge = <span className="ghw-chip pr-closed">closed</span>;
  else if (pr.draft) badge = <span className="ghw-chip pr-draft">draft</span>;
  else if (pr.mergeable) badge = <span className="ghw-chip pr-mergeable">mergeable</span>;
  else badge = <span className="ghw-chip pr-conflict">conflict</span>;
  return (
    <button className={`ghw-fcard ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="ghw-fcard-top"><span className="ghw-fcard-num ghw-mono">#{pr.number}</span></div>
      <span className="ghw-fcard-title">{pr.title}</span>
      <div className="ghw-fcard-badges">{badge}<span className="ghw-chip type ghw-mono">{pr.head.ref}</span></div>
    </button>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export default function GithubWorkflowSandbox({ user }) {
  const [repos, setRepos] = useState([]);
  const [currentRepo, setCurrentRepo] = useState(null);
  const [repoOpen, setRepoOpen] = useState(false);

  const [activeNav, setActiveNav] = useState('issues');
  const [activeFilter, setActiveFilter] = useState('all');

  const [issues, setIssues] = useState([]);
  const [prs, setPrs] = useState([]);
  const [fileTree, setFileTree] = useState([]);

  const [selected, setSelected] = useState(null); // {type:'issue'|'pr'|'new', num}
  const [issueComments, setIssueComments] = useState({});
  const [prFiles, setPrFiles] = useState({});
  const [typingFor, setTypingFor] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [replyDraft, setReplyDraft] = useState('');
  const [pingedPrs, setPingedPrs] = useState({});

  const [ctxPickerOpen, setCtxPickerOpen] = useState(false);
  const [newIssueContext, setNewIssueContext] = useState([]);
  const [form, setForm] = useState({ title: '', task: '', type: 'Code Writer', priority: 'Normal' });

  const repoKey = (r = currentRepo) => (r ? `${r.owner}/${r.repo}` : '');

  /* load tracked repos once */
  useEffect(() => {
    mockFetchTrackedRepos().then((data) => {
      setRepos(data);
      setCurrentRepo(data[0]);
    });
  }, []);

  /* load issues / prs / file tree whenever the repo changes */
  useEffect(() => {
    if (!currentRepo) return;
    const key = repoKey(currentRepo);
    setSelected(null);
    setActiveFilter('all');
    mockGhFetch(`/repos/${key}/issues?state=all`).then(setIssues);
    mockGhFetch(`/repos/${key}/pulls?state=all`).then(setPrs);
    mockGhFetch(`/repos/${key}/git/trees/HEAD?recursive=1`).then((r) => setFileTree(r.tree || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRepo]);

  /* load comments for the selected issue */
  useEffect(() => {
    if (!selected || selected.type !== 'issue' || !currentRepo) return;
    const key = repoKey(currentRepo);
    mockGhFetch(`/repos/${key}/issues/${selected.num}/comments`).then((c) =>
      setIssueComments((prev) => ({ ...prev, [selected.num]: c }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, currentRepo]);

  /* load files for the selected PR */
  useEffect(() => {
    if (!selected || selected.type !== 'pr' || !currentRepo) return;
    if (prFiles[selected.num]) return;
    const key = repoKey(currentRepo);
    mockGhFetch(`/repos/${key}/pulls/${selected.num}/files`).then((f) =>
      setPrFiles((prev) => ({ ...prev, [selected.num]: f }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, currentRepo]);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 3200);
  }

  async function sendReply(issue) {
    const text = replyDraft.trim();
    if (!text) return;
    const key = repoKey(currentRepo);
    setReplyDraft('');

    await mockGhFetch(`/repos/${key}/issues/${issue.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: text }),
    });
    const afterPost = await mockGhFetch(`/repos/${key}/issues/${issue.number}/comments`);
    setIssueComments((prev) => ({ ...prev, [issue.number]: afterPost }));
    setTypingFor(issue.number);

    // the mock backend schedules a bot reply ~3s after a human comment
    setTimeout(async () => {
      const updated = await mockGhFetch(`/repos/${key}/issues/${issue.number}/comments`);
      setIssueComments((prev) => ({ ...prev, [issue.number]: updated }));
      setTypingFor(null);
      const last = updated[updated.length - 1];
      const parsed = parseAgentBody(issue.body);
      if (last && last.user.type === 'Bot' && parsed.notifyEmail === user.email) {
        setNotifications((prev) => [{ num: issue.number, preview: stripEmoji(last.body).slice(0, 60) }, ...prev]);
        showToast(`agent[bot] replied on #${issue.number}`);
      }
    }, 3200);
  }

  async function createIssue() {
    if (!form.title.trim() || !form.task.trim()) return;
    const key = repoKey(currentRepo);
    const body = `[Agent Call]\n\nTask:\n${form.task.trim()}\n${
      newIssueContext.length ? `\nContext:\n${newIssueContext.join(', ')}\n` : ''
    }\nType:\n${form.type}\n\nPriority:\n${form.priority}\n\nNotifyEmail:\n${user.email}\n`;

    const created = await mockGhFetch(`/repos/${key}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title: `[Agent Call] ${form.title.trim()}`, body }),
    });
    setIssues((prev) => [created, ...prev]);
    setForm({ title: '', task: '', type: 'Code Writer', priority: 'Normal' });
    setNewIssueContext([]);
    setCtxPickerOpen(false);
    setSelected({ type: 'issue', num: created.number });
  }

  function pingToMerge(pr) {
    if (pingedPrs[pr.number]) return;
    setPingedPrs((prev) => ({ ...prev, [pr.number]: true }));
    showToast(`Pinged ${pr.user.login} to merge #${pr.number}`);
  }

  function toggleContextPath(path) {
    setNewIssueContext((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  }

  if (!currentRepo) {
    return <div className="ghw-root"><div className="ghw-loading">loading workspace&hellip;</div></div>;
  }

  const key = repoKey(currentRepo);
  const filteredIssues = activeFilter === 'all'
    ? issues
    : issues.filter((i) => stageOf(i, issueComments[i.number]) === activeFilter);

  const selectedIssue = selected && selected.type === 'issue' ? issues.find((i) => i.number === selected.num) : null;
  const selectedPr = selected && selected.type === 'pr' ? prs.find((p) => p.number === selected.num) : null;
  const selectedComments = selectedIssue ? (issueComments[selectedIssue.number] || []) : [];
  const selectedPrFiles = selectedPr ? (prFiles[selectedPr.number] || []) : [];
  const maxChange = Math.max(1, ...selectedPrFiles.map((f) => f.additions + f.deletions));

  return (
    <div className="ghw-root">
      <div className="ghw-shell">

        {/* ─── column 1: rail ─── */}
        <div className="ghw-rail">
          <div className="ghw-repo-picker">
            <button className="ghw-repo-picker-btn" onClick={() => setRepoOpen((o) => !o)}>
              <span className="ghw-repo-dot" />
              <span className="ghw-rp-text">
                <span className="ghw-rp-name">{currentRepo.name}</span>
                <span className="ghw-rp-handle ghw-mono">{key}</span>
              </span>
              <span className="ghw-chev">&#9662;</span>
            </button>
            {repoOpen && (
              <div className="ghw-repo-dropdown">
                {repos.map((r) => (
                  <button
                    key={`${r.owner}/${r.repo}`}
                    className="ghw-repo-opt"
                    onClick={() => { setCurrentRepo(r); setRepoOpen(false); }}
                  >
                    <span className="ghw-rn">{r.name}</span>
                    <span className="ghw-rh ghw-mono">{r.owner}/{r.repo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ghw-nav-label">workspace</div>
          <button className={`ghw-nav-link ${activeNav === 'issues' ? 'active' : ''}`} onClick={() => { setActiveNav('issues'); setSelected(null); }}>
            <span className="ghw-n-icon">&#9776;</span>Issues<span className="ghw-count">{issues.length}</span>
          </button>
          <button className={`ghw-nav-link ${activeNav === 'prs' ? 'active' : ''}`} onClick={() => { setActiveNav('prs'); setSelected(null); }}>
            <span className="ghw-n-icon">&#8983;</span>Pull requests<span className="ghw-count">{prs.length}</span>
          </button>

          <div className="ghw-rail-spacer" />

          <div className="ghw-bell-wrap">
            <button className="ghw-bell-row" onClick={() => setBellOpen((o) => !o)}>
              <span className="ghw-n-icon">&#128276;</span>Notifications
              {notifications.length > 0 && <span className="ghw-bell-dot" />}
            </button>
            {bellOpen && (
              <div className="ghw-bell-drop">
                <div className="ghw-bell-drop-head">
                  <span>notifications</span>
                  {notifications.length > 0 && (
                    <a href="#" onClick={(e) => { e.preventDefault(); setNotifications([]); }}>clear</a>
                  )}
                </div>
                {notifications.length === 0
                  ? <div className="ghw-bell-empty">no new notifications</div>
                  : notifications.map((n, idx) => (
                    <div className="ghw-bell-item" key={idx}><b>agent[bot]</b> replied on #{n.num} &mdash; {n.preview}</div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── column 2: feed ─── */}
        <div className="ghw-feed">
          {activeNav === 'issues' ? (
            <>
              <div className="ghw-feed-head">
                <button className="ghw-new-btn" onClick={() => { setSelected({ type: 'new' }); setNewIssueContext([]); setCtxPickerOpen(false); }}>
                  + New issue
                </button>
                <div className="ghw-tabs">
                  {['all', 'bot', 'human', 'done'].map((f) => (
                    <button key={f} className={`ghw-tab ${activeFilter === f ? 'active' : ''}`} onClick={() => { setActiveFilter(f); setSelected(null); }}>
                      {{ all: 'All', bot: 'Awaiting bot', human: 'Awaiting you', done: 'PR ready' }[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ghw-feed-list">
                {filteredIssues.length === 0
                  ? <div className="ghw-feed-empty">no issues in this view.</div>
                  : filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.number}
                      issue={issue}
                      comments={issueComments[issue.number]}
                      selected={selected && selected.type === 'issue' && selected.num === issue.number}
                      onClick={() => setSelected({ type: 'issue', num: issue.number })}
                    />
                  ))}
              </div>
            </>
          ) : (
            <>
              <div className="ghw-feed-head"><div className="ghw-nav-label" style={{ marginTop: 2 }}>open pull requests</div></div>
              <div className="ghw-feed-list">
                {prs.length === 0
                  ? <div className="ghw-feed-empty">no pull requests for this repo.</div>
                  : prs.map((pr) => (
                    <PrCard
                      key={pr.number}
                      pr={pr}
                      selected={selected && selected.type === 'pr' && selected.num === pr.number}
                      onClick={() => setSelected({ type: 'pr', num: pr.number })}
                    />
                  ))}
              </div>
            </>
          )}
        </div>

        {/* ─── column 3: stage ─── */}
        <div className="ghw-stage">
          {!selected && (
            <div className="ghw-stage-empty">
              <div className="big">nothing selected</div>
              <div>pick an issue or pull request from the feed</div>
            </div>
          )}

          {selected && selected.type === 'new' && (
            <>
              <div className="ghw-stage-head"><h1>New agent issue</h1><div className="ghw-stage-sub">{key}</div></div>
              <div className="ghw-form-field">
                <label>title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Add caching layer to search" />
              </div>
              <div className="ghw-form-field">
                <label>task</label>
                <textarea rows={5} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="describe exactly what the agent should do..." />
              </div>
              <div className="ghw-form-field">
                <label>context</label>
                <div className="ghw-ctx-chips">
                  {newIssueContext.length === 0
                    ? <span style={{ color: 'var(--ghw-text-faint)', fontSize: 11 }}>no files selected</span>
                    : newIssueContext.map((p) => <span key={p} className="ghw-ctx-chip ghw-mono">{p}</span>)}
                </div>
                <button type="button" className="ghw-picker-toggle" onClick={() => setCtxPickerOpen((o) => !o)}>
                  {ctxPickerOpen ? 'hide file explorer' : 'browse repo files'}
                </button>
                {ctxPickerOpen && (
                  <FileTree tree={fileTree} pickerMode pickedPaths={newIssueContext} onTogglePath={toggleContextPath} />
                )}
              </div>
              <div className="ghw-form-row">
                <div className="ghw-form-field">
                  <label>type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option>Code Writer</option><option>Code Reviewer</option><option>Code Suggester</option>
                  </select>
                </div>
                <div className="ghw-form-field">
                  <label>priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option>Normal</option><option>Immediate</option><option>High</option><option>Low</option>
                  </select>
                </div>
              </div>
              <button className="ghw-submit-btn" onClick={createIssue}>Create issue</button>
              <button className="ghw-cancel-link" onClick={() => setSelected(null)}>cancel</button>
            </>
          )}

          {selectedIssue && (() => {
            const stage = stageOf(selectedIssue, selectedComments);
            const parsed = parseAgentBody(selectedIssue.body);
            const prNum = linkedPrNumber(selectedComments);
            return (
              <>
                <div className="ghw-stage-head">
                  <div className="num ghw-mono">#{selectedIssue.number}</div>
                  <h1>{cleanTitle(selectedIssue.title)}</h1>
                  <div className="ghw-stage-sub">opened {timeAgo(selectedIssue.created_at)} by {selectedIssue.user.login}</div>
                  <div className="ghw-stage-badges">
                    <span className={`ghw-chip stage-${stage}`}>{stageLabel(stage)}</span>
                    <span className={`ghw-chip ${priClass(parsed.priority)}`}>{parsed.priority}</span>
                    <span className="ghw-chip type">{parsed.type}</span>
                  </div>
                </div>

                {stage === 'done' && (
                  <div className="ghw-banner ok">
                    <span>PR is ready for this issue.</span>
                    {prNum && (
                      <a className="jump" onClick={() => { setActiveNav('prs'); setSelected({ type: 'pr', num: prNum }); }}>
                        view PR #{prNum} &#8594;
                      </a>
                    )}
                  </div>
                )}

                <div className="ghw-issue-body">{parsed.task || selectedIssue.body}</div>

                {parsed.context.length > 0 && (
                  <>
                    <p className="ghw-section-label">referenced context</p>
                    <FileTree tree={fileTree} highlightPaths={parsed.context} pickerMode={false} pickedPaths={[]} onTogglePath={() => {}} />
                  </>
                )}

                <p className="ghw-section-label">activity</p>
                <div className="ghw-thread">
                  {selectedComments.length === 0
                    ? <p style={{ color: 'var(--ghw-text-faint)', fontSize: 12 }}>no messages yet &mdash; the agent hasn&rsquo;t responded.</p>
                    : selectedComments.map((c, idx) => (
                      <div className={`ghw-msg ${c.user.type === 'Bot' ? 'bot' : 'you'}`} key={idx}>
                        <div className="ghw-msg-head"><span>{c.user.login}</span><span className="ts">{timeAgo(c.created_at)}</span></div>
                        {c.body}
                      </div>
                    ))}
                </div>
                {typingFor === selectedIssue.number && (
                  <div className="ghw-typing">agent[bot] is typing<span className="dot" /><span className="dot" /><span className="dot" /></div>
                )}

                <div className="ghw-reply-row">
                  <input
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendReply(selectedIssue); }}
                    placeholder={stage === 'human' ? 'reply, or use !continue to proceed...' : 'reply...'}
                  />
                  <button onClick={() => sendReply(selectedIssue)}>Send</button>
                </div>
                <p className="ghw-reply-hint">use <code>!discuss</code> to ask the agent to revise, <code>!continue</code> to proceed with current direction.</p>
              </>
            );
          })()}

          {selectedPr && (
            <>
              <div className="ghw-stage-head">
                <div className="num ghw-mono">#{selectedPr.number}</div>
                <h1>{selectedPr.title}</h1>
              </div>
              {selectedPr.state === 'closed' ? (
                <div className="ghw-banner" style={{ background: 'var(--ghw-surface-2)', border: '1px solid var(--ghw-line)', color: 'var(--ghw-text-dim)' }}>
                  this pull request is closed.
                </div>
              ) : selectedPr.mergeable ? (
                <div className="ghw-banner ok">no conflicts &mdash; ready to merge.</div>
              ) : (
                <div className="ghw-banner conflict">this branch has conflicts with the base branch.</div>
              )}
              <div className="ghw-pr-meta">
                <span className="ghw-mono">{selectedPr.head.ref}</span> &#8594; <span className="ghw-mono">{selectedPr.base.ref}</span>
                {' '}&middot; opened by {selectedPr.user.login}{selectedPr.draft ? ' \u00b7 draft' : ''}
              </div>
              <p className="ghw-section-label">changed files</p>
              {selectedPrFiles.map((f) => {
                const addPct = Math.round((f.additions / maxChange) * 100);
                const delPct = Math.round((f.deletions / maxChange) * 100);
                return (
                  <div className="ghw-diff-row" key={f.filename}>
                    <span className="fname ghw-mono">{f.filename}</span>
                    <span className="fstatus">{f.status}</span>
                    <div className="bar"><div className="add" style={{ width: `${addPct}%` }} /><div className="del" style={{ width: `${delPct}%` }} /></div>
                    <span className="stat"><span className="a">+{f.additions}</span> <span className="r">-{f.deletions}</span></span>
                  </div>
                );
              })}
              {selectedPr.state === 'open' && !selectedPr.draft && (
                <div style={{ marginTop: 16 }}>
                  <button className={`ghw-ping-btn ${pingedPrs[selectedPr.number] ? 'sent' : ''}`} onClick={() => pingToMerge(selectedPr)}>
                    {pingedPrs[selectedPr.number] ? 'pinged \u2713' : 'ping to merge'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="ghw-toast ghw-toast-show"><b>&#8226;</b> {toast}</div>}
    </div>
  );
}
