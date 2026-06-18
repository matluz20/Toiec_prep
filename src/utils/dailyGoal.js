// Daily goal + exam countdown system.
// Turns the app into a coach: "X days left, hit your daily goal."

const GOAL_KEY = 'toeic_daily_goal';      // XP target per day
const EXAM_KEY = 'toeic_exam_date';       // ISO date string
const TARGET_KEY = 'toeic_target_score';  // desired TOEIC score
const PROGRESS_KEY = 'toeic_daily_progress'; // { date, xp }

const DEFAULT_GOAL = 30;

export function getDailyGoal() {
  const v = parseInt(localStorage.getItem(GOAL_KEY), 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_GOAL;
}

export function setDailyGoal(xp) {
  localStorage.setItem(GOAL_KEY, String(xp));
}

export function getExamDate() {
  return localStorage.getItem(EXAM_KEY) || null;
}

export function setExamDate(isoDate) {
  if (isoDate) localStorage.setItem(EXAM_KEY, isoDate);
  else localStorage.removeItem(EXAM_KEY);
}

export function getTargetScore() {
  const v = parseInt(localStorage.getItem(TARGET_KEY), 10);
  return Number.isFinite(v) ? v : null;
}

export function setTargetScore(score) {
  if (score) localStorage.setItem(TARGET_KEY, String(score));
}

// Days remaining until the exam (null if no date set, 0 if today/past).
export function getDaysUntilExam() {
  const iso = getExamDate();
  if (!iso) return null;
  const exam = new Date(iso);
  exam.setHours(23, 59, 59, 999);
  const now = new Date();
  const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// Today's XP progress toward the daily goal.
export function getTodayProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    const today = new Date().toDateString();
    if (raw.date === today) return raw.xp || 0;
    return 0;
  } catch {
    return 0;
  }
}

// Add XP to today's tally. Returns true if the goal was JUST reached.
export function addDailyXP(xp) {
  const today = new Date().toDateString();
  const before = getTodayProgress();
  const after = before + xp;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ date: today, xp: after }));
  const goal = getDailyGoal();
  return before < goal && after >= goal;
}

export function isDailyGoalMet() {
  return getTodayProgress() >= getDailyGoal();
}

// Suggest a daily goal based on exam date and target score.
// More days = gentler pace; fewer days = more intense.
export function suggestDailyGoal(daysLeft, targetScore) {
  if (!daysLeft || daysLeft <= 0) return DEFAULT_GOAL;
  const base = targetScore && targetScore >= 800 ? 50 : 30;
  if (daysLeft <= 14) return base + 20;
  if (daysLeft <= 30) return base + 10;
  return base;
}

// A short motivational plan line for the home screen.
export function getPlanMessage() {
  const days = getDaysUntilExam();
  const target = getTargetScore();
  if (days === null) return null;
  if (days === 0) return "It's exam day — you've got this! 🎯";
  const goal = getDailyGoal();
  if (target) {
    return `${days} days until your exam · ${goal} XP/day to reach ${target}`;
  }
  return `${days} days until your exam · ${goal} XP/day`;
}

export function hasCompletedSetup() {
  return localStorage.getItem('toeic_goal_setup') === 'true';
}

export function markSetupComplete() {
  localStorage.setItem('toeic_goal_setup', 'true');
}
