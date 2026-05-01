import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../supabase';
import { getGuestId } from '../supabase';

export default function Leaderboard({ show, st, lvl, lbTab, setLbTab, user }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setPlayers(data);
      setLoading(false);
    });
  }, []);

  // Current user ID (Google or guest)
  const myId = user ? user.id : getGuestId();

  // Build display name
  const myName = st.username || (user ? user.user_metadata?.full_name : 'You');

  // Make sure current user appears even if not in DB yet
  const myEntry = players.find((p) => p.user_id === myId);
  const allPlayers = myEntry
    ? players
    : [...players, { user_id: myId, display_name: myName, xp: st.xp, best_score: st.bestScore || 0, is_guest: !user }];

  const sorted =
    lbTab === 'xp'
      ? [...allPlayers].sort((a, b) => b.xp - a.xp)
      : [...allPlayers].sort((a, b) => (b.best_score || 0) - (a.best_score || 0) || b.xp - a.xp);

  const myRank = sorted.findIndex((p) => p.user_id === myId) + 1;
  const medals = ['🥇', '🥈', '🥉'];
  const rankCls = ['gold', 'silver', 'bronze'];

  function getDisplayName(p) {
    return p.display_name || p.username || (p.is_guest ? 'Guest' : 'Anonymous');
  }

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div>
          <div className="ph-title">🏆 Rankings</div>
          <div className="ph-sub">Real-time leaderboard</div>
        </div>
      </div>

      <div className="lb-wrap">
        {/* My card */}
        <div className="lb-user-card">
          {user ? (
            <img src={user.user_metadata?.avatar_url} alt="avatar" className="lb-avatar-img" />
          ) : (
            <div className="lb-avatar">{(myName || '?')[0].toUpperCase()}</div>
          )}
          <div className="lb-user-info">
            <div className="lb-username">
              {myName || 'Guest'}
              {user
                ? <span className="lb-badge google">Google</span>
                : <span className="lb-badge guest">Guest</span>}
            </div>
            <div className="lb-user-stats">
              {st.xp} XP · Best: {st.bestScore || 0}/10 · Level {lvl + 1}
            </div>
          </div>
          <div className="lb-user-rank">#{myRank}</div>
        </div>

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
              const isMe = p.user_id === myId;
              return (
                <div key={p.user_id} className={`lb-item${isMe ? ' me' : ''}`}>
                  <div className={`lb-rank ${rankCls[i] || ''}`}>{medals[i] || i + 1}</div>
                  <div className="lb-info">
                    <div className="lb-name">
                      {getDisplayName(p)}{isMe ? ' (you)' : ''}
                      {p.is_guest
                        ? <span className="lb-badge guest">Guest</span>
                        : <span className="lb-badge google">Google</span>}
                    </div>
                    <div className="lb-sub">
                      {lbTab === 'xp' ? `Best score: ${p.best_score || 0}/10` : `${p.xp} XP total`}
                    </div>
                  </div>
                  <div className={`lb-val${lbTab === 'xp' ? ' green' : ''}`}>
                    {lbTab === 'xp' ? `${p.xp} XP` : `${p.best_score || 0}/10`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
