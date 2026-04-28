import React, { useState } from 'react';

export default function Result({
  show, speak, st,
  questions, score, sessionXP,
  missedWords,
  onSaveUsername, onSkipSave,
  startQuiz,
}) {
  const [inputVal, setInputVal] = useState('');
  const [saved, setSaved] = useState(!!st.username);

  const pct = score / questions.length;
  const msg =
    pct === 1 ? 'Perfect score! Outstanding TOEIC preparation 🎯' :
    pct >= 0.8 ? 'Excellent! Keep going to unlock more words.' :
    pct >= 0.6 ? 'Good job! Review the missed words below.' :
    'Keep practising — every quiz brings you closer to the next level!';

  const uniq = missedWords.filter((v, i, a) => a.findIndex((x) => x.word === v.word) === i);
  const showPrompt = !st.promptShown && !saved;

  function handleSave() {
    const val = inputVal.trim();
    if (!val) return;
    onSaveUsername(val);
    setSaved(true);
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

        {/* Save prompt — shown after first quiz */}
        {showPrompt && !saved && (
          <div className="save-prompt">
            <div className="save-prompt-title">🏆 Save your progress?</div>
            <div className="save-prompt-sub">
              Choose a username to appear on the leaderboard and keep your XP across sessions.
            </div>
            <div className="save-row">
              <input
                className="save-input"
                placeholder="Choose a username..."
                maxLength={20}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
              <button className="save-go" onClick={handleSave}>Save →</button>
            </div>
            <span className="save-skip" onClick={onSkipSave}>Not now, continue without saving</span>
          </div>
        )}

        {saved && st.username && (
          <div className="save-done show">
            ✓ Saved as <strong>{st.username}</strong> — you're on the leaderboard!
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