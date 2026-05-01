import React, { useState } from 'react';
import { checkUsernameAvailable } from '../supabase';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Result({
  show, speak, st,
  questions, score, sessionXP,
  missedWords,
  onSaveUsername, onSkipSave,
  startQuiz,
  user, handleGoogleLogin,
}) {
  const [inputVal, setInputVal] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSet, setUsernameSet] = useState(false);

  const pct = score / questions.length;
  const msg =
    pct === 1 ? 'Perfect score! Outstanding TOEIC preparation 🎯' :
    pct >= 0.8 ? 'Excellent! Keep going to unlock more words.' :
    pct >= 0.6 ? 'Good job! Review the missed words below.' :
    'Keep practising — every quiz brings you closer to the next level!';

  const uniq = missedWords.filter((v, i, a) => a.findIndex((x) => x.word === v.word) === i);

  // Show Google prompt after first quiz if not logged in and prompt not shown yet
  const showGooglePrompt = !user && !st.promptShown;

  // Show username picker after Google login if no username yet
  const showUsernamePicker = user && !st.username && !usernameSet;

  async function handleSetUsername() {
    const val = inputVal.trim();
    if (!val || val.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    setUsernameLoading(true);
    setUsernameError('');
    const available = await checkUsernameAvailable(val);
    if (!available) {
      setUsernameError('This username is already taken');
      setUsernameLoading(false);
      return;
    }
    onSaveUsername(val);
    setUsernameSet(true);
    setUsernameLoading(false);
  }

  function handleUseFirstName() {
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Player';
    onSaveUsername(name);
    setUsernameSet(true);
  }

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div><div className="ph-title">Results</div></div>
      </div>

      <div className="result-wrap">
        <div className="r-top">
          <div className="r-score">{score}</div>
          <div className="r-lbl">correct out of {questions.length}</div>
          <div className="r-xp">+{sessionXP} XP earned</div>
          <div className="r-msg">{msg}</div>
        </div>

        {/* Google prompt — after first quiz, not logged in */}
        {showGooglePrompt && (
          <div className="save-prompt">
            <div className="save-prompt-icon">☁️</div>
            <div className="save-prompt-title">Save your progress!</div>
            <div className="save-prompt-sub">
              You earned <strong>+{sessionXP} XP</strong> — sign in with Google
              to save on all your devices and join the leaderboard.
            </div>
            <button className="google-btn-full" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Continue with Google
            </button>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <span className="save-skip" onClick={onSkipSave}>
                Continue without saving
              </span>
            </div>
          </div>
        )}

        {/* Username picker — after Google login, no username yet */}
        {showUsernamePicker && (
          <div className="save-prompt">
            <div className="save-prompt-icon">✏️</div>
            <div className="save-prompt-title">Choose your username</div>
            <div className="save-prompt-sub">
              This is what others will see on the leaderboard — not your real name.
              Must be unique and at least 3 characters.
            </div>
            <div className="save-prompt-guest">
              <input
                className={`save-input${usernameError ? ' input-error' : ''}`}
                placeholder="e.g. TOEICmaster95..."
                maxLength={20}
                value={inputVal}
                onChange={(e) => { setInputVal(e.target.value); setUsernameError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSetUsername(); }}
                autoFocus
              />
              <button
                className="save-go"
                onClick={handleSetUsername}
                disabled={usernameLoading}
              >
                {usernameLoading ? '...' : 'Save →'}
              </button>
            </div>
            {usernameError && (
              <div className="username-error">{usernameError}</div>
            )}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span className="save-skip" onClick={handleUseFirstName}>
                Use my first name instead
              </span>
            </div>
          </div>
        )}

        {/* Synced banner */}
        {user && st.username && (
          <div className="sync-banner">
            ☁️ Progress saved · playing as <strong>{st.username}</strong>
          </div>
        )}

        {/* Missed words */}
        {uniq.length > 0 && (
          <div className="missed-section">
            <div className="missed-title">
              Words to review <span className="missed-tag">{uniq.length} missed</span>
            </div>
            <div className="missed-list">
              {uniq.map((m) => (
                <div key={m.word} className="missed-item">
                  <div>
                    <div className="missed-word">{m.word}</div>
                    <div className="missed-def">{m.def}</div>
                  </div>
                  <button className="missed-spk" onClick={() => speak(m.word)}>🔊</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="r-acts">
          <button onClick={() => startQuiz(false)}>Play again</button>
          <button className="primary" onClick={() => show('home')}>Home →</button>
        </div>
      </div>
    </div>
  );
}
