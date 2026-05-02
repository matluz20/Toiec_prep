import React, { useState, useEffect } from 'react';

export default function Home({
  st, show, speak, CATS, LEVELS, BADGES,
  lvl, wpc, unlockedCount,
  startQuiz, startChallenge,startRevision,
  user, handleGoogleLogin, handleSignOut,startCategoryQuiz,
  startSuddenDeath,
  startReversedQuiz,darkMode, setDarkMode,
}) {
  const [wodOpen, setWodOpen] = useState(false);
  const [wod, setWod] = useState(null);

  useEffect(() => {
    const all = Object.values(CATS).flatMap((c) => c.words);
    const item = all[Math.floor(Math.random() * all.length)];
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
          <button
            className="dark-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {user ? (
            <div className="user-pill">
              <img src={user.user_metadata?.avatar_url} alt="avatar" className="user-avatar" />
              <span className="user-name">{st.username || user.user_metadata?.full_name?.split(' ')[0]}</span>
              <button className="signout-btn" onClick={handleSignOut}>✕</button>
            </div>
          ) : (
            <button className="google-btn" onClick={handleGoogleLogin}>
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in
            </button>
            
            
          )}
          <button className="lb-btn" onClick={() => show('leaderboard')}>🏆</button>
          <div className="streak-pill">🔥 {st.streak}</div>
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
        <div className="stat-box"><div className="stat-num">500</div><div className="stat-lbl">total words</div></div>
        <div className="stat-box"><div className="stat-num">{st.bestScore !== null ? `${st.bestScore}/10` : '—'}</div><div className="stat-lbl">best score</div></div>
        <div className="stat-box"><div className="stat-num">{st.earnedBadges.length}</div><div className="stat-lbl">badges</div></div>
      </div>

      


      {/* Modes */}

<div className="coming-soon-strip" onClick={() => alert('🔜 TOEIC Simulator coming soon !')}>
  <span className="coming-soon-strip-icon">🏅</span>
  <span className="coming-soon-strip-text">TOEIC Simulator — 200 questions · score 300–990</span>
  <span className="coming-soon-strip-badge">Soon</span>
</div>


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
    <div className="mbadge mb-coral" style={st.challengeDone ? { background: '#E1F5EE', color: '#0F6E56' } : {}}>
      {st.challengeDone ? '✓ done' : 'available'}
    </div>
  </div>



  <div className="mode-card" onClick={startRevision}>
    <div className="mode-ic ic-purple">📖</div>
    <div className="mode-lbl">Revision</div>
    <div className="mode-desc">Review your missed words</div>
    <div className="mbadge mb-purple">
      {JSON.parse(localStorage.getItem('toeic_missed_words') || '[]').length > 0
        ? `${JSON.parse(localStorage.getItem('toeic_missed_words')).length} words to review`
        : 'No words yet'}
    </div>
  </div>
  <div className="mode-card" onClick={startSuddenDeath}>
    <div className="mode-ic ic-red">💀</div>
    <div className="mode-lbl">Sudden Death</div>
    <div className="mode-desc">One wrong answer = game over</div>
    <div className="mbadge mb-red">How far can you go?</div>
  </div>
  <div className="mode-card" onClick={startReversedQuiz}>
    <div className="mode-ic ic-purple">🔄</div>
    <div className="mode-lbl">Reversed</div>
    <div className="mode-desc">French → find the English word</div>
    <div className="mbadge mb-purple">+5 XP per correct</div>
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
