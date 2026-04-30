import React, { useState, useEffect } from 'react';

export default function Home({
  st, show, speak, CATS, LEVELS, BADGES,
  lvl, wpc, unlockedCount,
  startQuiz, startChallenge,
  darkMode, toggleDark,
}) {
  const [wodOpen, setWodOpen] = useState(false);
  const [wod, setWod] = useState(null);

  useEffect(() => {
    const all = Object.values(CATS).flatMap((c) => c.words);
    const item = all[Math.floor(Date.now() / 60000) % all.length];
    setWod(item);
  }, [CATS]);

  const cur = LEVELS[lvl];
  const nxt = LEVELS[lvl + 1];
  const pct = nxt
    ? Math.min(100, Math.round(((st.xp - cur.xp) / (nxt.xp - cur.xp)) * 100))
    : 100;

  return (
    <div>
      {/* Header */}
      <div className="home-top">
        <div className="logo">TOEIC Prep</div>
        <div className="top-right">
          <button className="lb-btn" onClick={() => show('leaderboard')}>🏆 Rankings</button>
          <div className="streak-pill">🔥 {st.streak}</div>
          <button className="dark-toggle" onClick={toggleDark} title="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Word of the moment */}
      {wod && (
        <div className={`wod${wodOpen ? ' open' : ''}`} onClick={() => setWodOpen(!wodOpen)}>
          <div className="wod-badge">Word of the moment ↺</div>
          <div className="wod-row">
            <span className="wod-word">{wod.w}</span>
            <div className="wod-actions">
              <span className="wod-type">{wod.t}</span>
              <button className="spk" onClick={(e) => { e.stopPropagation(); speak(wod.w); }}>🔊</button>
            </div>
          </div>
          <div className="wod-def">{wod.d}</div>
          <div className="wod-dfr">{wod.dfr}</div>
          {wodOpen && <div className="wod-ex">{wod.e}</div>}
        </div>
      )}

      {/* Level bar */}
      <div className="lvl-wrap">
        <div className="lvl-top">
          <span className="lvl-name">Level {lvl + 1} — {cur.name}</span>
          <span className="lvl-xp">{st.xp} XP</span>
        </div>
        <div className="lvl-bar">
          <div className="lvl-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="lvl-hint">
          {nxt
            ? `+${nxt.xp - st.xp} XP → unlock ${(nxt.wpc - cur.wpc) * Object.keys(CATS).length} new words (Level ${lvl + 2} — ${nxt.name})`
            : 'Maximum level reached — all 96 words unlocked!'}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box"><div className="stat-num">{unlockedCount}</div><div className="stat-lbl">unlocked</div></div>
        <div className="stat-box"><div className="stat-num">96</div><div className="stat-lbl">total words</div></div>
        <div className="stat-box"><div className="stat-num">{st.bestScore !== null ? `${st.bestScore}/10` : '—'}</div><div className="stat-lbl">best score</div></div>
        <div className="stat-box"><div className="stat-num">{st.earnedBadges.length}</div><div className="stat-lbl">badges</div></div>
      </div>

      {/* Modes */}
      <div className="sec-title">Training modes</div>
      <div className="mode-grid">
        <div className="mode-card" onClick={() => show('vocab')}>
          <div className="mode-ic ic-blue">📚</div>
          <div className="mode-lbl">Vocabulary</div>
          <div className="mode-desc">Unlock words as you level up</div>
        </div>
        <div className="mode-card hl" onClick={() => startQuiz(false)}>
          <div className="mode-ic ic-teal">⚡</div>
          <div className="mode-lbl">Mixed quiz</div>
          <div className="mode-desc">MCQ + flashcard + fill in + write</div>
          <div className="mbadge mb-teal">+5 XP per correct</div>
        </div>
        <div className="mode-card" onClick={() => startQuiz(true)}>
          <div className="mode-ic ic-amber">⏱️</div>
          <div className="mode-lbl">Speed mode</div>
          <div className="mode-desc">Fast answers = bonus XP</div>
          <div className="mbadge mb-amber">+bonus under 10s</div>
        </div>
        <div className="mode-card" onClick={startChallenge}>
          <div className="mode-ic ic-coral">💪</div>
          <div className="mode-lbl">Daily challenge</div>
          <div className="mode-desc">5 special questions</div>
          <div className={`mbadge mb-coral`} style={st.challengeDone ? { background: '#E1F5EE', color: '#0F6E56' } : {}}>
            {st.challengeDone ? '✓ done' : 'available'}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="sec-title" style={{ marginTop: '0.25rem' }}>My badges</div>
      <div className="badges-row">
        {BADGES.map((b) => {
          const earned = st.earnedBadges.includes(b.id);
          return (
            <div key={b.id} className={`badge-item ${earned ? 'earned' : 'locked'}`}>
              <div className="badge-emoji">{b.emoji}</div>
              <div className="badge-name">{b.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}