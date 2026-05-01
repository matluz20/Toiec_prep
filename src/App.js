import React, { useState, useEffect } from 'react';
import './App.css';
import { CATS, LEVELS, BADGES } from './data/words';
import { getLvl, getWPC, getUnlockedCount, speak, buildPool, buildRevisionPool, saveProgress, loadProgress, updateStreak } from './utils/helpers';
import { supabase, signInWithGoogle, signOut, saveProgressToCloud, loadProgressFromCloud } from './supabase';
import Home from './components/Home';
import Vocab from './components/Vocab';
import VocabList from './components/VocabList';
import Quiz from './components/Quiz';
import Result from './components/Result';
import Leaderboard from './components/Leaderboard';

const INITIAL_STATE = {
  xp: 0,
  streak: 0,
  quizzes: 0,
  bestScore: null,
  earnedBadges: [],
  username: null,
  promptShown: false,
  challengeDone: false,
  perfectScores: 0,
  fastAnswers: 0,
};

function stateFromCloud(data) {
  return {
    xp: data.xp || 0,
    streak: data.streak || 0,
    quizzes: data.quizzes || 0,
    bestScore: data.best_score || null,
    earnedBadges: data.earned_badges || [],
    username: data.username || null,
    promptShown: true,
    challengeDone: data.challenge_done || false,
    perfectScores: data.perfect_scores || 0,
    fastAnswers: data.fast_answers || 0,
  };
}

function stateToCloud(st) {
  return {
    xp: st.xp,
    streak: st.streak,
    quizzes: st.quizzes,
    best_score: st.bestScore,
    earned_badges: st.earnedBadges,
    username: st.username,
    challenge_done: st.challengeDone,
    perfect_scores: st.perfectScores,
    fast_answers: st.fastAnswers,
  };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [showSplash, setShowSplash] = useState(() => !localStorage.getItem('toeic_visited'));
  const [st, setSt] = useState(() => loadProgress() || INITIAL_STATE);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentCat, setCurrentCat] = useState('');
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [timerMode, setTimerMode] = useState(false);
  const [missedWords, setMissedWords] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [lbTab, setLbTab] = useState('xp');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('toeic_dark') === 'true');
  const [navItems, setNavItems] = useState(() => {
    const saved = localStorage.getItem('toeic_nav');
    return saved ? JSON.parse(saved) : ['home', 'vocab', 'quiz', 'revision', 'leaderboard'];
  });
  const [showNavEditor, setShowNavEditor] = useState(false);

  useEffect(() => {
    localStorage.setItem('toeic_dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncFromCloud(session.user);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        syncFromCloud(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function syncFromCloud(googleUser) {
    const data = await loadProgressFromCloud(googleUser.id);
    if (data) {
      const cloudSt = stateFromCloud(data);
      setSt(cloudSt);
      saveProgress(cloudSt);
    } else {
      const local = loadProgress() || INITIAL_STATE;
      const merged = { ...local, username: null, promptShown: true };
      setSt(merged);
      saveProgress(merged);
      await saveProgressToCloud(googleUser.id, stateToCloud(merged), false);
    }
  }

  useEffect(() => {
    saveProgress(st);
    if (user) {
      const timer = setTimeout(() => {
        saveProgressToCloud(user.id, stateToCloud(st), false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [st, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const lvl = getLvl(st.xp, LEVELS);
  const wpc = getWPC(st.xp, LEVELS);
  const unlockedCount = getUnlockedCount(st.xp, LEVELS, CATS);

  function updateSt(patch) {
    setSt((prev) => ({ ...prev, ...patch }));
  }

  function checkBadges(currentSt) {
    const updated = [...currentSt.earnedBadges];
    BADGES.forEach((b) => {
      if (!updated.includes(b.id) && b.cond({
        ...currentSt,
        unlockedCount: getUnlockedCount(currentSt.xp, LEVELS, CATS),
      })) {
        updated.push(b.id);
      }
    });
    return { earnedBadges: updated };
  }

  function show(id) { setScreen(id); }

  function startQuiz(chrono) {
    const pool = buildPool(CATS, wpc);
    if (!pool.length) return;
    setQuestions(pool.slice(0, 10));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(!!chrono);
    setQuizTitle(chrono ? 'Speed mode ⏱️' : 'Mixed quiz ⚡');
    show('quiz');
  }

  function startChallenge() {
    if (st.challengeDone) { alert('Daily challenge already done! Come back tomorrow 💪'); return; }
    const pool = buildPool(CATS, wpc);
    if (!pool.length) return;
    setQuestions(pool.slice(0, 5));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('Daily challenge 💪');
    show('quiz');
  }

  function startRevision() {
    const pool = buildRevisionPool(CATS);
    if (!pool.length) { alert('No words to review yet! Complete a quiz first. 💪'); return; }
    setQuestions(pool.slice(0, Math.min(pool.length, 10)));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('Revision mode 📖');
    show('quiz');
  }

  function startCategoryQuiz(cat) {
    const words = CATS[cat].words.slice(0, wpc);
    if (words.length < 4) { alert('Not enough words unlocked in this category!'); return; }
    const allDefs = Object.values(CATS).flatMap((c) => c.words).map((w) => w.d);
    const pool = [];
    words.forEach((item) => {
      const wrongDefs = allDefs.filter((d) => d !== item.d).sort(() => Math.random() - 0.5).slice(0, 3);
      pool.push({
        word: item.w, type: 'mcq',
        q: `What does "${item.w}" mean?`,
        opts: [...wrongDefs, item.d].sort(() => Math.random() - 0.5),
        correct: item.d, ex: item.e,
        hint: `Type: ${item.t} — starts with "${item.w[0].toUpperCase()}" (${item.w.length} letters)`,
        dfr: item.dfr,
      });
      pool.push({
        word: item.w, type: 'write',
        q: `Write the English word that means:\n"${item.dfr}"`,
        correct: item.w, ex: item.e,
        hint: `Starts with "${item.w[0].toUpperCase()}" — ${item.w.length} letters`,
      });
    });
    setQuestions(pool.sort(() => Math.random() - 0.5).slice(0, 10));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle(`${CATS[cat].icon} ${cat}`);
    show('quiz');
  }

  function startSuddenDeath() {
    const pool = buildPool(CATS, wpc);
    if (!pool.length) return;
    setQuestions(pool.slice(0, 30));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('💀 Sudden Death');
    show('quiz');
  }

  function startReversedQuiz() {
    const allWords = Object.values(CATS).flatMap((c) => c.words.slice(0, wpc));
    if (allWords.length < 4) return;
    const allWordsList = allWords.map((w) => w.w);
    const pool = allWords.map((item) => {
      const wrongWords = allWordsList.filter((w) => w !== item.w).sort(() => Math.random() - 0.5).slice(0, 3);
      return {
        word: item.w, type: 'mcq',
        q: `Which word means:\n"${item.dfr}" ?`,
        opts: [...wrongWords, item.w].sort(() => Math.random() - 0.5),
        correct: item.w, ex: item.e,
        hint: `Starts with "${item.w[0].toUpperCase()}" — ${item.w.length} letters`,
        dfr: item.dfr,
      };
    });
    setQuestions(pool.sort(() => Math.random() - 0.5).slice(0, 10));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('🔄 Reversed quiz');
    show('quiz');
  }

  function onAnswer({ correct, xpGained, word, def, fast, suddenDeath }) {
    if (correct) {
      setScore((s) => s + 1);
      setSessionXP((s) => s + xpGained);
      setSt((prev) => ({
        ...prev,
        xp: prev.xp + xpGained,
        fastAnswers: fast ? prev.fastAnswers + 1 : prev.fastAnswers,
      }));
    } else {
      setMissedWords((prev) => [...prev, { word, def }]);
      if (suddenDeath) {
        setTimeout(() => onQuizEnd(), 1500);
      }
    }
  }

  function onNextQ() {
    if (qIdx + 1 >= questions.length) onQuizEnd();
    else setQIdx((i) => i + 1);
  }

  function onQuizEnd() {
    const finalScore = score;
    const isChallenge = quizTitle.includes('challenge');
    const isRevision = quizTitle.includes('Revision');
    const newStreak = updateStreak(st);

    if (missedWords.length > 0) {
      const uniq = missedWords.filter((v, i, a) => a.findIndex((x) => x.word === v.word) === i);
      localStorage.setItem('toeic_missed_words', JSON.stringify(uniq));
    }
    if (isRevision) {
      localStorage.removeItem('toeic_missed_words');
    }

    setSt((prev) => {
      const newBestScore = prev.bestScore === null || finalScore > prev.bestScore ? finalScore : prev.bestScore;
      const updatedSt = {
        ...prev,
        streak: newStreak,
        quizzes: prev.quizzes + 1,
        bestScore: newBestScore,
        perfectScores: finalScore === questions.length ? prev.perfectScores + 1 : prev.perfectScores,
        challengeDone: isChallenge ? true : prev.challengeDone,
      };
      const { earnedBadges } = checkBadges(updatedSt);
      updatedSt.earnedBadges = earnedBadges;
      return updatedSt;
    });
    show('result');
  }

  function onSaveUsername(name) { updateSt({ username: name, promptShown: true }); }
  function onSkipSave() { setSt((prev) => ({ ...prev, promptShown: true })); }
  async function handleGoogleLogin() { await signInWithGoogle(); }
  async function handleSignOut() {
    await signOut();
    localStorage.removeItem('toeic_progress');
    localStorage.removeItem('toeic_guest_id');
    setUser(null);
    setSt(INITIAL_STATE);
    setScreen('home');
  }

  function toggleNavItem(id) {
    const active = navItems.includes(id);
    if (active) {
      if (navItems.length <= 2) return;
      const updated = navItems.filter((i) => i !== id);
      setNavItems(updated);
      localStorage.setItem('toeic_nav', JSON.stringify(updated));
    } else {
      if (navItems.length >= 5) return;
      const updated = [...navItems, id];
      setNavItems(updated);
      localStorage.setItem('toeic_nav', JSON.stringify(updated));
    }
  }

  if (loadingAuth) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`}>
        <div className="loading-screen">
          <div className="loading-dot" />
        </div>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`}>
        <div className="splash">
          <div className="splash-content">
            <div className="splash-logo">TOEIC Prep</div>
            <div className="splash-emoji">🎯</div>
            <h1 className="splash-title">Prépare ton TOEIC<br />sans stress</h1>
            <p className="splash-desc">
              Vocabulaire essentiel, quiz variés et système
              de progression pour maximiser ton score.
            </p>
            <div className="splash-features">
              <div className="splash-feat">📚 500+ mots TOEIC</div>
              <div className="splash-feat">⚡ Quiz interactifs</div>
              <div className="splash-feat">🏆 Classement mondial</div>
              <div className="splash-feat">☁️ Progression sauvegardée</div>
            </div>
            <button
              className="splash-btn"
              onClick={() => { localStorage.setItem('toeic_visited', 'true'); setShowSplash(false); }}
            >
              Commencer gratuitement →
            </button>
            <p className="splash-note">Aucune inscription requise pour commencer</p>
          </div>
        </div>
      </div>
    );
  }

  const props = {
    st, updateSt, show, speak,
    CATS, LEVELS, BADGES,
    lvl, wpc, unlockedCount,
    currentCat, setCurrentCat,
    questions, qIdx, score, sessionXP,
    timerMode, missedWords, quizTitle,
    onAnswer, onNextQ,
    onSaveUsername, onSkipSave,
    lbTab, setLbTab,
    startQuiz, startChallenge,
    user, handleGoogleLogin, handleSignOut,
    startRevision, startCategoryQuiz, startSuddenDeath, startReversedQuiz,
    darkMode, setDarkMode,
    navItems, setNavItems, showNavEditor, setShowNavEditor,
  };

  const NAV_ALL = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'vocab', icon: '📚', label: 'Vocabulary' },
    { id: 'quiz', icon: '⚡', label: 'Mixed quiz' },
    { id: 'speed', icon: '⏱️', label: 'Speed mode' },
    { id: 'revision', icon: '📖', label: 'Revision' },
    { id: 'death', icon: '💀', label: 'Sudden Death' },
    { id: 'reversed', icon: '🔄', label: 'Reversed' },
    { id: 'leaderboard', icon: '🏆', label: 'Rankings' },
  ];

  const navActions = {
    home: () => show('home'),
    vocab: () => show('vocab'),
    quiz: () => startQuiz(false),
    speed: () => startQuiz(true),
    revision: startRevision,
    death: startSuddenDeath,
    reversed: startReversedQuiz,
    leaderboard: () => show('leaderboard'),
  };

  const navActiveScreens = {
    home: screen === 'home',
    vocab: screen === 'vocab' || screen === 'vocab-list',
    quiz: false,
    speed: false,
    revision: false,
    death: false,
    reversed: false,
    leaderboard: screen === 'leaderboard',
  };

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {screen === 'home' && <Home {...props} />}
      {screen === 'vocab' && <Vocab {...props} />}
      {screen === 'vocab-list' && <VocabList {...props} />}
      {screen === 'quiz' && <Quiz {...props} />}
      {screen === 'result' && <Result {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} />}

      {screen !== 'quiz' && (
        <>
          <nav
            className="bottom-nav"
            onContextMenu={(e) => { e.preventDefault(); setShowNavEditor(true); }}
            onTouchStart={(e) => {
              const el = e.currentTarget;
              el._pressTimer = setTimeout(() => setShowNavEditor(true), 600);
            }}
            onTouchEnd={(e) => clearTimeout(e.currentTarget._pressTimer)}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el._pressTimer = setTimeout(() => setShowNavEditor(true), 600);
            }}
            onMouseUp={(e) => clearTimeout(e.currentTarget._pressTimer)}
            onMouseLeave={(e) => clearTimeout(e.currentTarget._pressTimer)}
          >
            {navItems.map((id) => {
              const item = NAV_ALL.find((n) => n.id === id);
              if (!item) return null;
              const isQuizBtn = id === 'quiz';
              return (
                <button
                  key={id}
                  className={`nav-item${isQuizBtn ? ' nav-quiz-btn' : ''}${navActiveScreens[id] ? ' active' : ''}`}
                  onClick={navActions[id]}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {showNavEditor && (
            <div className="nav-editor-overlay" onClick={() => setShowNavEditor(false)}>
              <div className="nav-editor" onClick={(e) => e.stopPropagation()}>
                <div className="nav-editor-title">Customize your navbar</div>
                <div className="nav-editor-sub">Choose up to 5 shortcuts</div>
                <div className="nav-editor-list">
                  {NAV_ALL.map((item) => {
                    const active = navItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`nav-editor-item${active ? ' active' : ''}`}
                        onClick={() => toggleNavItem(item.id)}
                      >
                        <span className="nav-editor-icon">{item.icon}</span>
                        <span className="nav-editor-label">{item.label}</span>
                        <span className="nav-editor-check">{active ? '✓' : '+'}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="nav-editor-hint">
                  {navItems.length}/5 selected · Hold navbar to edit again
                </div>
                <button className="nav-editor-close" onClick={() => setShowNavEditor(false)}>
                  Done ✓
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}