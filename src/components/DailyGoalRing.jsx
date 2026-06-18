import React from 'react';
import { getDailyGoal, getTodayProgress, getPlanMessage } from '../utils/dailyGoal';

export default function DailyGoalRing({ onClick }) {
  const goal = getDailyGoal();
  const done = getTodayProgress();
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const met = done >= goal;
  const plan = getPlanMessage();

  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="daily-goal" onClick={onClick}>
      <div className="daily-goal-ring">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} className="dg-ring-bg" />
          <circle
            cx="32" cy="32" r={radius}
            className={`dg-ring-fill${met ? ' met' : ''}`}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <div className="daily-goal-center">
          {met ? <span className="dg-check">✓</span> : <span className="dg-pct">{pct}%</span>}
        </div>
      </div>
      <div className="daily-goal-info">
        <div className="daily-goal-title">
          {met ? 'Daily goal complete! 🎉' : `Daily goal · ${done}/${goal} XP`}
        </div>
        <div className="daily-goal-sub">
          {plan || (met ? 'Come back tomorrow to keep your streak' : 'Keep going to hit your target')}
        </div>
      </div>
    </div>
  );
}
