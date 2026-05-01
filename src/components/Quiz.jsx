import React, { useState, useEffect, useRef } from 'react';

export default function Quiz({
  show, speak,
  questions, qIdx, score, sessionXP,
  timerMode, quizTitle,
  onAnswer, onNextQ,
}) {
  const [hintUsed, setHintUsed] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [flashRevealed, setFlashRevealed] = useState(false);
  const [writeVal, setWriteVal] = useState('');
  const [writeChecked, setWriteChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);
  const answeredRef = useRef(false);

  const q = questions[qIdx];

  // Reset state on new question
  useEffect(() => {
    setHintUsed(false);
    setHintVisible(false);
    setAnswered(false);
    setSelectedOpt(null);
    setFlashRevealed(false);
    setWriteVal('');
    setWriteChecked(false);
    setIsCorrect(null);
    setTimeLeft(15);
    answeredRef.current = false;
  }, [qIdx]);

  // Timer
  useEffect(() => {
    if (!timerMode) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, timerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle timeout when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && timerMode && !answeredRef.current && q) {
      answeredRef.current = true;
      setAnswered(true);
      setIsCorrect(false);
      onAnswer({ correct: false, xpGained: 0, word: q.word, def: q.correct, fast: false });
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  function handleHint() {
    setHintUsed(true);
    setHintVisible(true);
  }

  function handleOpt(opt) {
  if (answered || answeredRef.current) return;
  stopTimer();
  answeredRef.current = true;
  const ok = opt === q.correct;
  const fast = timerMode && timeLeft > 10;
  const xp = ok ? (hintUsed ? 3 : fast ? 8 : 5) : 0;
  setSelectedOpt(opt);
  setAnswered(true);
  setIsCorrect(ok);
  onAnswer({ correct: ok, xpGained: xp, word: q.word, def: q.correct, fast, suddenDeath: !ok && quizTitle.includes('Sudden Death') });
}

  function handleFlashAnswer(knew) {
    if (answeredRef.current) return;
    stopTimer();
    answeredRef.current = true;
    const xp = knew ? (hintUsed ? 3 : 5) : 0;
    setAnswered(true);
    setIsCorrect(knew);
    onAnswer({ correct: knew, xpGained: xp, word: q.word, def: q.correct, fast: false });
  }

  function handleWrite() {
    if (answered || answeredRef.current) return;
    stopTimer();
    answeredRef.current = true;
    const ok = writeVal.trim().toLowerCase() === q.correct.toLowerCase();
    const xp = ok ? (hintUsed ? 3 : 5) : 0;
    setWriteChecked(true);
    setAnswered(true);
    setIsCorrect(ok);
    onAnswer({ correct: ok, xpGained: xp, word: q.correct, def: q.correct, fast: false, suddenDeath: !ok && quizTitle.includes('Sudden Death') });
  }

  if (!q) return null;

  const pct = (qIdx / questions.length) * 100;
  const labels = { mcq: 'Multiple choice', flash: 'Flashcard', fill: 'Fill in the blank', write: 'Write the word' };
  const badgeCls = { mcq: 'qt-mcq', flash: 'qt-flash', fill: 'qt-fill', write: 'qt-write' };

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div>
          <div className="ph-title">{quizTitle}</div>
          <div className="ph-sub">Answer correctly to earn XP</div>
        </div>
      </div>

      <div className="qwrap">
        <div className="qpbar"><div className="qpfill" style={{ width: `${pct}%` }} /></div>

        <div className="q-meta">
          <div className="q-cnt">Question {qIdx + 1} / {questions.length}</div>
          {timerMode && (
            <div className={`q-timer${timeLeft <= 5 ? ' urgent' : ''}`}>⏱ {timeLeft}s</div>
          )}
        </div>

        <div className={`qtbadge ${badgeCls[q.type]}`}>{labels[q.type]}</div>
        <div className="q-text">{q.q}</div>

        {/* Hint */}
        <div className="hint-row">
          <button
            className="hint-btn"
            disabled={hintUsed || answered}
            onClick={handleHint}
          >
            💡 Hint <span style={{ fontSize: 10, color: '#bbb' }}>(-2 XP)</span>
          </button>
          {hintVisible && <div className="hint-box">💡 {q.hint}</div>}
        </div>

        {/* MCQ / Fill */}
        {(q.type === 'mcq' || q.type === 'fill') && (
          <div className="opts">
            {q.opts.map((opt) => {
              let cls = 'opt';
              if (answered) {
                if (opt === q.correct) cls += ' correct';
                else if (opt === selectedOpt) cls += ' wrong';
              }
              return (
                <button key={opt} className={cls} disabled={answered} onClick={() => handleOpt(opt)}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Flashcard */}
        {q.type === 'flash' && (
          <div>
            <div style={{ textAlign: 'center', padding: '.75rem 0 .5rem' }}>
              <div style={{ fontSize: 30, fontWeight: 500, marginBottom: 8 }}>{q.word}</div>
              <button className="vi-spk" onClick={() => speak(q.word)}>🔊 Listen</button>
            </div>
            {!flashRevealed && !answered && (
              <button className="flash-reveal" onClick={() => setFlashRevealed(true)}>Reveal definition</button>
            )}
            {(flashRevealed || answered) && (
              <div className="flash-def-box">
                <div className="flash-def-t">{q.correct}</div>
                <div className="flash-dfr">{q.dfr}</div>
                <div className="flash-ex-t">{q.ex}</div>
              </div>
            )}
            {flashRevealed && !answered && (
              <div className="flash-btns">
                <button className="flash-btn knew" onClick={() => handleFlashAnswer(true)}>I knew it ✓</button>
                <button className="flash-btn didnt" onClick={() => handleFlashAnswer(false)}>Didn't know ✗</button>
              </div>
            )}
          </div>
        )}

        {/* Write */}
        {q.type === 'write' && (
          <div>
            <input
              className="write-input"
              placeholder="Type the word in English..."
              value={writeVal}
              onChange={(e) => setWriteVal(e.target.value)}
              disabled={writeChecked}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWrite(); }}
            />
            <button className="sub-btn" onClick={handleWrite} disabled={writeChecked}>Check →</button>
          </div>
        )}

        {/* Feedback */}
        {answered && (
          <div className={`fb ${isCorrect ? 'ok' : 'ko'}`}>
            {isCorrect
              ? <>✓ Correct! <span className="xpp">+{hintUsed ? 3 : timerMode && timeLeft > 10 ? 8 : 5} XP</span> — {q.ex}</>
              : timeLeft === 0
                ? `⏱ Time's up! Answer: "${q.correct}"`
                : q.type === 'flash'
                  ? `Remember: "${q.correct}"`
                  : `✗ Answer: "${q.correct}" — ${q.ex}`
            }
          </div>
        )}

        {answered && (
          <button className="nxt" onClick={onNextQ}>
            {qIdx + 1 >= questions.length ? 'See results →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  );
}
