import React, { useState } from 'react';
import {
  setExamDate, setTargetScore, setDailyGoal,
  suggestDailyGoal, markSetupComplete,
} from '../utils/dailyGoal';

const SCORE_OPTIONS = [
  { v: 600, label: '600', desc: 'Intermediate', emoji: '🌱', color: '#1D9E75' },
  { v: 750, label: '750', desc: 'Upper-inter.', emoji: '📘', color: '#185FA5' },
  { v: 850, label: '850', desc: 'Advanced', emoji: '🚀', color: '#534AB7' },
  { v: 950, label: '950', desc: 'Expert', emoji: '🏆', color: '#BA7517' },
];

export default function GoalSetup({ onDone }) {
  const [step, setStep] = useState(0);
  const [examIso, setExamIso] = useState('');
  const [target, setTarget] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const daysLeft = examIso
    ? Math.max(0, Math.ceil((new Date(examIso) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;
  const computedGoal = suggestDailyGoal(daysLeft, target);

  function finish() {
    if (examIso) setExamDate(examIso);
    if (target) setTargetScore(target);
    setDailyGoal(computedGoal);
    markSetupComplete();
    onDone();
  }

  const selectedScore = SCORE_OPTIONS.find((o) => o.v === target);

  return (
    <div className="goal-setup-overlay">
      <div className="goal-setup-card">

        {/* Progress dots */}
        <div className="gs-dots">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`gs-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
          ))}
        </div>

        {/* STEP 0 — exam date */}
        {step === 0 && (
          <div className="gs-step">
            <div className="gs-icon-badge" style={{ background: 'linear-gradient(135deg, #E1F5EE, #E6F1FB)' }}>
              <span>📅</span>
            </div>
            <h2 className="gs-title">When's your exam?</h2>
            <p className="gs-desc">We'll build a daily plan to get you ready right on time.</p>

            <input
              type="date"
              className="gs-date"
              min={today}
              value={examIso}
              onChange={(e) => setExamIso(e.target.value)}
            />

            {daysLeft !== null && daysLeft > 0 && (
              <div className="gs-days-pill">⏳ {daysLeft} days to prepare</div>
            )}

            <button className="gs-btn" onClick={() => setStep(1)}>
              {examIso ? 'Continue →' : 'Skip — no date yet →'}
            </button>
          </div>
        )}

        {/* STEP 1 — target score */}
        {step === 1 && (
          <div className="gs-step">
            <div className="gs-icon-badge" style={{ background: 'linear-gradient(135deg, #EEEDFE, #E6F1FB)' }}>
              <span>🎯</span>
            </div>
            <h2 className="gs-title">Your target score?</h2>
            <p className="gs-desc">TOEIC is scored from 10 to 990. Pick your goal.</p>

            <div className="gs-scores">
              {SCORE_OPTIONS.map((opt) => (
                <button
                  key={opt.v}
                  className={`gs-score${target === opt.v ? ' active' : ''}`}
                  style={target === opt.v ? { borderColor: opt.color, background: `${opt.color}12` } : {}}
                  onClick={() => setTarget(opt.v)}
                >
                  <span className="gs-score-emoji">{opt.emoji}</span>
                  <span className="gs-score-num" style={target === opt.v ? { color: opt.color } : {}}>{opt.label}+</span>
                  <span className="gs-score-desc">{opt.desc}</span>
                </button>
              ))}
            </div>

            <button className="gs-btn" onClick={() => setStep(2)} disabled={!target}>
              Continue →
            </button>
            <button className="gs-skip" onClick={finish}>Skip for now</button>
          </div>
        )}

        {/* STEP 2 — plan recap */}
        {step === 2 && (
          <div className="gs-step">
            <div className="gs-icon-badge gs-icon-success">
              <span>✨</span>
            </div>
            <h2 className="gs-title">Your plan is ready!</h2>
            <p className="gs-desc">Here's what we've set up for you.</p>

            <div className="gs-plan">
              {target && (
                <div className="gs-plan-row">
                  <span className="gs-plan-icon">{selectedScore?.emoji}</span>
                  <span className="gs-plan-label">Target score</span>
                  <span className="gs-plan-value">{target}+</span>
                </div>
              )}
              {daysLeft !== null && daysLeft > 0 && (
                <div className="gs-plan-row">
                  <span className="gs-plan-icon">📅</span>
                  <span className="gs-plan-label">Time left</span>
                  <span className="gs-plan-value">{daysLeft} days</span>
                </div>
              )}
              <div className="gs-plan-row gs-plan-highlight">
                <span className="gs-plan-icon">⚡</span>
                <span className="gs-plan-label">Daily goal</span>
                <span className="gs-plan-value">{computedGoal} XP/day</span>
              </div>
            </div>

            <div className="gs-note">
              📖 For now, the app focuses on <strong>vocabulary & reading</strong> (Parts 5–7). Listening practice is coming soon.
            </div>

            <button className="gs-btn gs-btn-final" onClick={finish}>
              Let's go! 🚀
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
