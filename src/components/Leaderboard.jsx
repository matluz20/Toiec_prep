import React from 'react';

export default function Leaderboard({ show, st, FAKE_PLAYERS, lvl, lbTab, setLbTab }) {
  const me = { name: st.username || 'You', xp: st.xp, best: st.bestScore || 0, isMe: true };
  const all = [...FAKE_PLAYERS.map((p) => ({ ...p, isMe: false })), me];
  const sorted =
    lbTab === 'xp'
      ? [...all].sort((a, b) => b.xp - a.xp)
      : [...all].sort((a, b) => b.best - a.best || b.xp - a.xp);

  const myRank = sorted.findIndex((p) => p.isMe) + 1;
  const medals = ['🥇', '🥈', '🥉'];
  const rankCls = ['gold', 'silver', 'bronze'];

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div>
          <div className="ph-title">🏆 Rankings</div>
          <div className="ph-sub">Top players worldwide</div>
        </div>
      </div>

      <div className="lb-wrap">
        {/* My card */}
        <div className="lb-user-card">
          <div className="lb-avatar">{(st.username || '?')[0].toUpperCase()}</div>
          <div className="lb-user-info">
            <div className="lb-username">{st.username || 'Guest'}</div>
            <div className="lb-user-stats">
              {st.xp} XP · Best: {st.bestScore || 0}/10 · Level {lvl + 1}
            </div>
          </div>
          <div className="lb-user-rank">#{myRank}</div>
        </div>

        {/* Tabs */}
        <div className="lb-tabs">
          <button
            className={`lb-tab${lbTab === 'xp' ? ' active' : ''}`}
            onClick={() => setLbTab('xp')}
          >XP Total</button>
          <button
            className={`lb-tab${lbTab === 'score' ? ' active' : ''}`}
            onClick={() => setLbTab('score')}
          >Best Score</button>
        </div>

        {/* List */}
        <div className="lb-list">
          {sorted.slice(0, 12).map((p, i) => (
            <div key={p.name} className={`lb-item${p.isMe ? ' me' : ''}`}>
              <div className={`lb-rank ${rankCls[i] || ''}`}>{medals[i] || i + 1}</div>
              <div className="lb-info">
                <div className="lb-name">{p.name}{p.isMe ? ' (you)' : ''}</div>
                <div className="lb-sub">
                  {lbTab === 'xp' ? `Best score: ${p.best}/10` : `${p.xp} XP total`}
                </div>
              </div>
              <div className={`lb-val${lbTab === 'xp' ? ' green' : ''}`}>
                {lbTab === 'xp' ? `${p.xp} XP` : `${p.best}/10`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}