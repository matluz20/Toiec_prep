import React, { useState } from 'react';
import {
  setExamDate, setTargetScore, setDailyGoal,
  suggestDailyGoal, markSetupComplete,
} from '../utils/dailyGoal';

const SCORE_OPTIONS = [
  { v: 600, label: '600+', desc: 'Intermediate' },
  { v: 750, label: '750+', desc: 'Upper-inter.' },
  { v: 850, label: '850+', desc: 'Advanced' },
  { v: 950, label: '950+', desc: 'Expert' },
];

export default function GoalSetup({ onDone }) {
  const [step, setStep] = useState(0);
  const [examIso, setExamIso] = useState('');
  const [target, setTarget] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  function finish() {
    if (examIso) setExamDate(examIso);
    if (target) setTargetScore(target);
    const days = examIso
      ? Math.ceil((new Date(examIso) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
    setDailyGoal(suggestDailyGoal(days, target));
    markSetupComplete();
    onDone();
  }

  return (
    <div className="goal-setup-overlay">
      <div className="goal-setup-card">
        {step === 0 && (
          <>
            <div className="goal-setup-emoji">🎯</div>
            <h2 className="goal-setup-title">When's your TOEIC exam?</h2>
            <p className="goal-setup-desc">
              We'll build a daily plan to get you ready in time.
            </p>
            <input
              type="date"
              className="goal-setup-date"
              min={today}
              value={examIso}
              onChange={(e) => setExamIso(e.target.value)}
            />
            <button className="goal-setup-btn" onClick={() => setStep(1)}>
              {examIso ? 'Next →' : 'I don\'t have a date yet →'}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="goal-setup-emoji">📊</div>
            <h2 className="goal-setup-title">What's your target score?</h2>
            <p className="goal-setup-desc">
              This helps us set the right daily pace for you.
            </p>
            <div className="goal-setup-scores">
              {SCORE_OPTIONS.map((opt) => (
                <button
                  key={opt.v}
                  className={`goal-score-btn${target === opt.v ? ' active' : ''}`}
                  onClick={() => setTarget(opt.v)}
                >
                  <span className="goal-score-num">{opt.label}</span>
                  <span className="goal-score-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button className="goal-setup-btn" onClick={finish} disabled={!target}>
              Start learning →
            </button>
            <button className="goal-setup-skip" onClick={finish}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
