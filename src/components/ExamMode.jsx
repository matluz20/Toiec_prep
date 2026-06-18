import React, { useState, useEffect } from 'react';
import { PART5_QUESTIONS } from '../data/part5';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function ExamMode({ show, onExamEnd }) {
  const [questions] = useState(() => shuffle(PART5_QUESTIONS).slice(0, 10));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [showWhy, setShowWhy] = useState(false);

  const q = questions[qIdx];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [qIdx]);

  function handleSelect(opt) {
    if (selected) return;
    setSelected(opt);
    setShowWhy(true);
    if (opt === q.correct) setScore((s) => s + 1);
  }

  function next() {
    if (qIdx + 1 >= questions.length) {
      onExamEnd(score, questions.length);
      return;
    }
    setSelected(null);
    setShowWhy(false);
    setQIdx((i) => i + 1);
  }

  const pct = Math.round(((qIdx) / questions.length) * 100);

  // Render the sentence with the blank highlighted
  const parts = q.sentence.split('_______');

  return (
    <div className="exam-screen">
      <div className="quiz-header">
        <button className="quiz-back" onClick={() => show('home')}>←</button>
        <div className="quiz-header-center">
          <div className="quiz-title-text">TOEIC Part 5</div>
          <div className="sudden-death-warning" style={{ color: 'var(--blue)' }}>Incomplete Sentences</div>
        </div>
        <div className="quiz-score-pill">
          <span className="quiz-score-num">{score}</span>
          <span className="quiz-score-sep">/</span>
          <span className="quiz-score-total">{questions.length}</span>
        </div>
      </div>

      <div className="quiz-progress-wrap">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="qwrap" key={qIdx}>
        <div className="exam-meta">
          <span className="exam-skill-badge">{q.skill}</span>
          <span className="exam-counter">Question {qIdx + 1} of {questions.length}</span>
        </div>

        <div className="exam-sentence">
          {parts[0]}
          <span className="exam-blank">{selected ? selected : '_____'}</span>
          {parts[1]}
        </div>

        <div className="exam-opts">
          {q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            let cls = 'exam-opt';
            if (selected) {
              if (opt === q.correct) cls += ' correct';
              else if (opt === selected) cls += ' wrong';
              else cls += ' dim';
            }
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={!!selected}
              >
                <span className="exam-opt-letter">{letter}</span>
                <span className="exam-opt-text">{opt}</span>
                {selected && opt === q.correct && <span className="exam-opt-icon">✓</span>}
                {selected && opt === selected && opt !== q.correct && <span className="exam-opt-icon">✕</span>}
              </button>
            );
          })}
        </div>

        {showWhy && (
          <div className={`exam-why${selected === q.correct ? ' correct' : ' wrong'}`}>
            <div className="exam-why-title">
              {selected === q.correct ? '✓ Correct!' : '✗ Not quite'} — Why "{q.correct}"?
            </div>
            <div className="exam-why-text">{q.why}</div>
          </div>
        )}

        {selected && (
          <button className="quiz-next-btn" onClick={next}>
            {qIdx + 1 >= questions.length ? 'See results →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  );
}
