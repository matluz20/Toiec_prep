// Spaced Repetition System (SRS) — simplified Anki-style algorithm
// Each word tracks: when it was last seen, and when it's due next.
// Getting a word right pushes the next review further out.
// Getting it wrong brings it back almost immediately.

const STORAGE_KEY = 'toeic_srs_v1';

// Intervals in minutes. Index = "box" level (Leitner system).
// Box 0 = brand new / just failed → see again in 10 min
// Each correct answer promotes the word one box (longer interval).
// A wrong answer demotes it back toward box 0.
const INTERVALS = [
  10,        // box 0: 10 minutes
  60 * 24,   // box 1: 1 day
  60 * 24 * 3,   // box 2: 3 days
  60 * 24 * 7,   // box 3: 1 week
  60 * 24 * 14,  // box 4: 2 weeks
  60 * 24 * 30,  // box 5: 1 month
];

function loadSRS() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSRS(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

// Record the result of reviewing a word.
// `word` is the English word string, `correct` is a boolean.
export function recordReview(word, correct) {
  const data = loadSRS();
  const now = Date.now();
  const entry = data[word] || { box: 0, due: now, seen: 0, lapses: 0 };

  entry.seen += 1;
  if (correct) {
    entry.box = Math.min(entry.box + 1, INTERVALS.length - 1);
  } else {
    entry.box = 0;
    entry.lapses += 1;
  }

  const intervalMin = INTERVALS[entry.box];
  entry.due = now + intervalMin * 60 * 1000;
  entry.last = now;

  data[word] = entry;
  saveSRS(data);
}

// Returns the list of words that are "due" right now, soonest first.
export function getDueWords() {
  const data = loadSRS();
  const now = Date.now();
  return Object.entries(data)
    .filter(([, e]) => e.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([word]) => word);
}

// How many words are due right now (for the badge on the home screen).
export function getDueCount() {
  return getDueWords().length;
}

// Build a revision pool from words that are currently due.
// Falls back to the legacy missed-words list if SRS is empty.
export function buildSRSPool(CATS) {
  const due = getDueWords();
  const allWords = Object.values(CATS).flatMap((c) => c.words);

  const source = due.length
    ? due
    : (() => {
        try {
          return JSON.parse(localStorage.getItem('toeic_missed_words') || '[]').map((m) => m.word);
        } catch {
          return [];
        }
      })();

  if (!source.length) return [];

  const pool = [];
  source.forEach((w) => {
    const full = allWords.find((x) => x.w === w);
    if (!full) return;
    // Alternate between flashcard and MCQ for variety + stronger recall
    const useMcq = Math.random() > 0.5;
    if (useMcq) {
      const otherDefs = allWords
        .filter((x) => x.d !== full.d)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((x) => x.d);
      pool.push({
        word: full.w,
        type: 'mcq',
        q: `What does "${full.w}" mean?`,
        opts: [...otherDefs, full.d].sort(() => Math.random() - 0.5),
        correct: full.d,
        ex: full.e,
        dfr: full.dfr,
        hint: `Type: ${full.t} — ${full.dfr}`,
      });
    } else {
      pool.push({
        word: full.w,
        type: 'flash',
        q: 'Do you know this word?',
        correct: full.d,
        ex: full.e,
        dfr: full.dfr,
        hint: `${full.t} — ${full.dfr}`,
      });
    }
  });
  return pool.sort(() => Math.random() - 0.5);
}

// Stats for display: how many words are being learned / mastered.
export function getSRSStats() {
  const data = loadSRS();
  const entries = Object.values(data);
  return {
    total: entries.length,
    mastered: entries.filter((e) => e.box >= 4).length,
    learning: entries.filter((e) => e.box >= 1 && e.box < 4).length,
    due: getDueCount(),
  };
}

// How many words in a given category are mastered (box >= 4 = known long-term).
export function getCategoryMastery(words) {
  const data = loadSRS();
  let mastered = 0;
  let started = 0;
  words.forEach((w) => {
    const e = data[w.w];
    if (e) {
      started += 1;
      if (e.box >= 4) mastered += 1;
    }
  });
  return { mastered, started };
}

// Export the full SRS data (for cloud sync).
export function exportSRS() {
  return loadSRS();
}

// Import SRS data from cloud, merging with local (keeps the most recent due date per word).
export function importSRS(cloudData) {
  if (!cloudData || typeof cloudData !== 'object') return;
  const local = loadSRS();
  const merged = { ...local };
  Object.entries(cloudData).forEach(([word, entry]) => {
    const existing = merged[word];
    // Keep whichever was reviewed most recently
    if (!existing || (entry.last || 0) > (existing.last || 0)) {
      merged[word] = entry;
    }
  });
  saveSRS(merged);
}
