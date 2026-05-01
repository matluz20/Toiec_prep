export function getLvl(xp, LEVELS) {
  let l = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) l = i;
  }
  return l;
}

export function getWPC(xp, LEVELS) {
  return LEVELS[getLvl(xp, LEVELS)].wpc;
}

export function getUnlockedCount(xp, LEVELS, CATS) {
  return getWPC(xp, LEVELS) * Object.keys(CATS).length;
}

export function speak(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const pref = ['Samantha', 'Karen', 'Google US English', 'Microsoft Zira'];
  let voice = null;
  for (const n of pref) {
    voice = voices.find((v) => v.name.includes(n) && v.lang.startsWith('en'));
    if (voice) break;
  }
  if (!voice) voice = voices.find((v) => v.lang === 'en-US') || null;
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = 'en-US';
  u.rate = 0.85;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

export function buildPool(CATS, wpc) {
  const all = Object.values(CATS).flatMap((c) =>
  [...c.words].sort(() => Math.random() - 0.5).slice(0, wpc)
);
  if (all.length < 4) return [];
  const allDefs = all.map((w) => w.d);
  const allWords = all.map((w) => w.w);
  const pool = [];
  all.forEach((item) => {
    const wD = allDefs.filter((d) => d !== item.d).sort(() => Math.random() - 0.5).slice(0, 3);
    const wW = allWords.filter((w) => w !== item.w).sort(() => Math.random() - 0.5).slice(0, 3);
    pool.push({
      word: item.w, type: 'mcq',
      q: `What does "${item.w}" mean?`,
      opts: [...wD, item.d].sort(() => Math.random() - 0.5),
      correct: item.d, ex: item.e,
      hint: `Type: ${item.t} — starts with "${item.w[0].toUpperCase()}" (${item.w.length} letters)`,
      dfr: item.dfr,
    });
    pool.push({
      word: item.w, type: 'flash',
      q: 'Do you know this word?',
      correct: item.d, ex: item.e, dfr: item.dfr,
      hint: `Type: ${item.t} — ${item.dfr}`,
    });
    pool.push({
      word: item.w, type: 'fill',
      q: `Fill in the blank:\n"${item.e.replace(new RegExp('\\b' + item.w + '\\b', 'i'), '_____')}"`,
      opts: [...wW, item.w].sort(() => Math.random() - 0.5),
      correct: item.w, ex: item.e,
      hint: `Starts with "${item.w[0].toUpperCase()}" — ${item.w.length} letters`,
    });
    pool.push({
      word: item.w, type: 'write',
      q: `Write the English word that means:\n"${item.dfr}"`,
      correct: item.w, ex: item.e,
      hint: `Starts with "${item.w[0].toUpperCase()}" — ${item.w.length} letters`,
    });
  });
  return pool.sort(() => Math.random() - 0.5);
}

export function saveProgress(state) {
  localStorage.setItem('toeic_progress', JSON.stringify(state));
}

export function loadProgress() {
  try {
    const saved = localStorage.getItem('toeic_progress');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}