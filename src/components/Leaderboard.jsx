import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, updateUsername, checkUsernameAvailable } from '../supabase';

export default function Leaderboard({ show, st, lvl, lbTab, setLbTab, user, onSaveUsername }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadLeaderboard() {
    setLoading(true);
    const data = await fetchLeaderboard();
    setPlayers(data);
    setLastRefresh(new Date());
    setLoading(false);
}

  const myId = user?.id;
  const myName = st.username || 'Anonymous';

  const myEntry = players.find((p) => p.user_id === myId);
  const allPlayers = myEntry
    ? players
    : user
      ? [...players, { user_id: myId, display_name: myName, xp: st.xp, best_score: st.bestScore || 0, is_guest: false }]
      : players;

  const sorted =
    lbTab === 'xp'
      ? [...allPlayers].sort((a, b) => b.xp - a.xp)
      : [...allPlayers].sort((a, b) => (b.best_score || 0) - (a.best_score || 0) || b.xp - a.xp);

  const myRank = user ? sorted.findIndex((p) => p.user_id === myId) + 1 : '—';
  const medals = ['🥇', '🥈', '🥉'];
  const rankCls = ['gold', 'silver', 'bronze'];

  function getDisplayName(p) {
    return p.display_name || p.username || 'Anonymous';
  }

  async function handleUpdateUsername() {
    const val = newUsername.trim();
    if (!val || val.length < 3) {
      setEditError('At least 3 characters required');
      return;
    }
    if (val === st.username) {
      setEditMode(false);
      return;
    }
    setEditLoading(true);
    setEditError('');
    const available = await checkUsernameAvailable(val);
    if (!available) {
      setEditError('Username already taken');
      setEditLoading(false);
      return;
    }
    const { error } = await updateUsername(user.id, val);
    if (error) {
      setEditError(error);
      setEditLoading(false);
      return;
    }
    onSaveUsername(val);
    setEditSuccess(true);
    setEditMode(false);
    setEditLoading(false);
    // Refresh leaderboard
    fetchLeaderboard().then((data) => setPlayers(data));
    setTimeout(() => setEditSuccess(false), 3000);
  }

  return (
    <div>

  <div className="ph">
  <button className="back" onClick={() => show('home')}>←</button>
  <div style={{ flex: 1 }}>
    <div className="ph-title">🏆 Rankings</div>
    <div className="ph-sub">
      {lastRefresh
        ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Loading...'}
    </div>
  </div>
  <button
    className="refresh-btn"
    onClick={loadLeaderboard}
    disabled={loading}
  >
    {loading ? '...' : '↺'}
  </button>
</div>

      <div className="lb-wrap">
        {/* My card */}
        <div className="lb-user-card">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="avatar" className="lb-avatar-img" />
          ) : (
            <div className="lb-avatar">{(myName)[0].toUpperCase()}</div>
          )}
          <div className="lb-user-info">
            <div className="lb-username">
              {myName}
              {user
                ? <span className="lb-badge google">Google</span>
                : <span className="lb-badge guest">Guest</span>}
            </div>
            <div className="lb-user-stats">
              {st.xp} XP · Best: {st.bestScore || 0}/10 · Level {lvl + 1}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div className="lb-user-rank">#{myRank}</div>
            {user && (
              <button
                className="edit-username-btn"
                onClick={() => { setEditMode(true); setNewUsername(st.username || ''); setEditError(''); }}
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {/* Edit username panel */}
        {editMode && (
          <div className="edit-username-panel">
            <div className="edit-username-title">Change your username</div>
            <div className="save-prompt-guest">
              <input
                className={`save-input${editError ? ' input-error' : ''}`}
                placeholder="New username..."
                maxLength={20}
                value={newUsername}
                onChange={(e) => { setNewUsername(e.target.value); setEditError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateUsername(); }}
                autoFocus
              />
              <button className="save-go" onClick={handleUpdateUsername} disabled={editLoading}>
                {editLoading ? '...' : 'Save →'}
              </button>
            </div>
            {editError && <div className="username-error">{editError}</div>}
            <span className="save-skip" onClick={() => setEditMode(false)}>Cancel</span>
          </div>
        )}

        {editSuccess && (
          <div className="sync-banner">✓ Username updated successfully!</div>
        )}

        {/* Tabs */}
        <div className="lb-tabs">
          <button className={`lb-tab${lbTab === 'xp' ? ' active' : ''}`} onClick={() => setLbTab('xp')}>XP Total</button>
          <button className={`lb-tab${lbTab === 'score' ? ' active' : ''}`} onClick={() => setLbTab('score')}>Best Score</button>
        </div>

        {/* List */}
        {loading ? (
          <div className="lb-loading">Loading leaderboard...</div>
        ) : (
          <div className="lb-list">
            {sorted.slice(0, 20).map((p, i) => {
              const isMe = user && p.user_id === myId;
              return (
                <div key={p.user_id} className={`lb-item${isMe ? ' me' : ''}`}>
                  <div className={`lb-rank ${rankCls[i] || ''}`}>{medals[i] || i + 1}</div>
                  <div className="lb-info">
                    <div className="lb-name">
                      {getDisplayName(p)}{isMe ? ' (you)' : ''}
                    </div>
                    <div className="lb-sub">
                      {lbTab === 'xp'
                        ? `Best score: ${p.best_score || 0}/10`
                        : `${p.xp} XP total`}
                    </div>
                  </div>
                  <div className={`lb-val${lbTab === 'xp' ? ' green' : ''}`}>
                    {lbTab === 'xp' ? `${p.xp} XP` : `${p.best_score || 0}/10`}
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="lb-loading">No players yet — be the first! 🏆</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
