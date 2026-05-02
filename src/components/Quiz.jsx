import React, { useState, useEffect, useRef } from 'react';
import { soundCorrect, soundWrong } from '../utils/effects';

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
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [xpFlash, setXpFlash] = useState(null);
  const timerRef = useRef(null);
  const answeredRef = useRef(false);

  const q = questions[qIdx];

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

  useEffect(() => {
    if (!timerMode) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, timerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timeLeft === 0 && timerMode && !answeredRef.current && q) {
      answeredRef.current = true;
      setAnswered(true);
      setIsCorrect(false);
      setCombo(0);
      soundWrong();
      onAnswer({ correct: false, xpGained: 0, word: q.word, def: q.correct, fast: false });
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() { clearInterval(timerRef.current); }

  function handleHint() { setHintUsed(true); setHintVisible(true); }

  function triggerCorrect(xp) {
    soundCorrect();
    setXpFlash(`+${xp} XP`);
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo >= 3) setShowCombo(true);
    setTimeout(() => { setXpFlash(null); setShowCombo(false); }, 1200);
  }

  function triggerWrong() {
    soundWrong();
    setCombo(0);
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
    if (ok) triggerCorrect(xp); else triggerWrong();
    onAnswer({ correct: ok, xpGained: xp, word: q.word, def: q.correct, fast, suddenDeath: !ok && quizTitle.includes('Sudden') });
  }

  function handleFlashAnswer(knew) {
    if (answeredRef.current) return;
    stopTimer();
    answeredRef.current = true;
    const xp = knew ? (hintUsed ? 3 : 5) : 0;
    setAnswered(true);
    setIsCorrect(knew);
    if (knew) triggerCorrect(xp); else triggerWrong();
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
    if (ok) triggerCorrect(xp); else triggerWrong();
    onAnswer({ correct: ok, xpGained: xp, word: q.correct, def: q.correct, fast: false });
  }

  if (!q) return null;

  const pct = (qIdx / questions.length) * 100;
  const isSuddenDeath = quizTitle.includes('Sudden');

  const typeConfig = {
    mcq: { label: 'Choose the answer', color: '#185FA5', bg: 'var(--blue-bg)', emoji: '🎯' },
    flash: { label: 'Flashcard', color: '#854F0B', bg: 'var(--amber-bg)', emoji: '⚡' },
    fill: { label: 'Fill in the blank', color: '#0F6E56', bg: 'var(--green-bg)', emoji: '✏️' },
    write: { label: 'Write the word', color: '#993C1D', bg: 'var(--coral-bg)', emoji: '📝' },
  };
  const tc = typeConfig[q.type] || typeConfig.mcq;

  const timerPct = (timeLeft / 15) * 100;
  const timerColor = timeLeft > 10 ? '#1D9E75' : timeLeft > 5 ? '#BA7517' : '#D85A30';

  return (
    <div className="quiz-screen">
      {/* Header */}
      <div className="quiz-header">
        <button className="quiz-back" onClick={() => show('home')}>←</button>
        <div className="quiz-header-center">
          <div className="quiz-title-text">{quizTitle}</div>
          {isSuddenDeath && <div className="sudden-death-warning">⚠️ One mistake = game over</div>}
        </div>
        <div className="quiz-score-pill">
          <span className="quiz-score-num">{score}</span>
          <span className="quiz-score-sep">/</span>
          <span className="quiz-score-total">{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="quiz-progress-wrap">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="quiz-progress-dots">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`quiz-dot${i < qIdx ? ' done' : i === qIdx ? ' current' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="qwrap">
        {/* Top row — counter + timer */}
        <div className="quiz-meta-row">
          <div className="quiz-counter">
            Question <strong>{qIdx + 1}</strong> / {questions.length}
          </div>
          {combo >= 3 && showCombo && (
            <div className="combo-badge">🔥 {combo}x Combo!</div>
          )}
          {xpFlash && <div className="xp-flash">{xpFlash}</div>}
          {timerMode && (
            <div className={`quiz-timer-pill${timeLeft <= 5 ? ' urgent' : ''}`}>
              <svg viewBox="0 0 32 32" className="timer-ring">
                <circle cx="16" cy="16" r="13" className="timer-ring-bg" />
                <circle
                  cx="16" cy="16" r="13"
                  className="timer-ring-fill"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 13}`,
                    strokeDashoffset: `${2 * Math.PI * 13 * (1 - timerPct / 100)}`,
                    stroke: timerColor,
                  }}
                />
              </svg>
              <span className="timer-num">{timeLeft}</span>
            </div>
          )}
        </div>

        {/* Type badge */}
        <div className="quiz-type-badge" style={{ background: tc.bg, color: tc.color }}>
          {tc.emoji} {tc.label}
        </div>

        {/* Question */}
        <div className="quiz-question">{q.q}</div>

        {/* Hint */}
        <div className="hint-row">
          <button
            className="hint-btn"
            disabled={hintUsed || answered}
            onClick={handleHint}
          >
            💡 Hint <span className="hint-cost">(-2 XP)</span>
          </button>
          {hintVisible && <div className="hint-box">💡 {q.hint}</div>}
        </div>

        {/* MCQ / Fill */}
        {(q.type === 'mcq' || q.type === 'fill') && (
          <div className="quiz-opts">
            {q.opts.map((opt, i) => {
              let cls = 'quiz-opt';
              if (answered) {
                if (opt === q.correct) cls += ' correct';
                else if (opt === selectedOpt) cls += ' wrong';
              }
              const letters = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={opt}
                  className={cls}
                  disabled={answered}
                  onClick={() => handleOpt(opt)}
                >
                  <span className="opt-letter">{letters[i]}</span>
                  <span className="opt-text">{opt}</span>
                  {answered && opt === q.correct && <span className="opt-check">✓</span>}
                  {answered && opt === selectedOpt && opt !== q.correct && <span className="opt-cross">✗</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Flashcard */}
        {q.type === 'flash' && (
          <div className="flash-card-wrap">
            <div className="flash-word-card">
              <div className="flash-word">{q.word}</div>
              <button className="flash-listen-btn" onClick={() => speak(q.word)}>
                🔊 Listen
              </button>
            </div>
            {!flashRevealed && !answered && (
              <button className="flash-reveal-btn" onClick={() => setFlashRevealed(true)}>
                Reveal definition →
              </button>
            )}
            {(flashRevealed || answered) && (
              <div className="flash-def-revealed">
                <div className="flash-def-en">{q.correct}</div>
                <div className="flash-def-fr">{q.dfr}</div>
                <div className="flash-def-ex">{q.ex}</div>
              </div>
            )}
            {flashRevealed && !answered && (
              <div className="flash-answer-btns">
                <button className="flash-knew" onClick={() => handleFlashAnswer(true)}>
                  ✓ I knew it
                </button>
                <button className="flash-didnt" onClick={() => handleFlashAnswer(false)}>
                  ✗ Didn't know
                </button>
              </div>
            )}
          </div>
        )}

        {/* Write */}
        {q.type === 'write' && (
          <div className="write-wrap">
            <input
              className="write-input"
              placeholder="Type the word in English..."
              value={writeVal}
              onChange={(e) => setWriteVal(e.target.value)}
              disabled={writeChecked}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWrite(); }}
              autoFocus
            />
            <button className="write-submit" onClick={handleWrite} disabled={writeChecked}>
              Check →
            </button>
          </div>
        )}

        {/* Feedback */}
        {answered && (
          <div className={`quiz-feedback${isCorrect ? ' correct' : ' wrong'}`}>
            <div className="feedback-icon">{isCorrect ? '🎉' : '💡'}</div>
            <div className="feedback-content">
              {isCorrect ? (
                <>
                  <div className="feedback-title">
                    Correct! {timerMode && timeLeft > 10 ? '⚡ Speed bonus!' : ''}
                  </div>
                  <div className="feedback-ex">{q.ex}</div>
                </>
              ) : (
                <>
                  <div className="feedback-title">
                    {timeLeft === 0 ? "⏱ Time's up!" : 'Not quite!'}
                  </div>
                  <div className="feedback-answer">
                    Answer: <strong>{q.correct}</strong>
                  </div>
                  <div className="feedback-ex">{q.ex}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button className="quiz-next-btn" onClick={onNextQ}>
            {qIdx + 1 >= questions.length ? 'See results 🏆' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
