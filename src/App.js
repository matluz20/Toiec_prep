import React, { useState, useEffect } from 'react';
import './App.css';
import { CATS, LEVELS, BADGES } from './data/words';
import { getLvl, getWPC, getUnlockedCount, speak, buildPool, buildRevisionPool, saveProgress, loadProgress,updateStreak } from './utils/helpers';
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
  const [showSplash, setShowSplash] = useState(() => {  // ← ajoute ici
  return !localStorage.getItem('toeic_visited');
  });
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
      // First Google login — preserve XP but force username picker
      const local = loadProgress() || INITIAL_STATE;
      const merged = { ...local, username: null, promptShown: true };
      setSt(merged);
      saveProgress(merged);
      await saveProgressToCloud(googleUser.id, stateToCloud(merged), false);
    }
  }

  // Save locally always, save to cloud only for Google users
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
    if (st.challengeDone) {
      alert('Daily challenge already done! Come back tomorrow 💪');
      return;
    }
    const pool = buildPool(CATS, wpc);
    if (!pool.length) return;
    setQuestions(pool.slice(0, 5));
    setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('Daily challenge 💪');
    show('quiz');
  }

  const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem('toeic_dark') === 'true';
    });
useEffect(() => {
  // Apply dark class to .app div instead of body
  localStorage.setItem('toeic_dark', darkMode);
}, [darkMode]);



  function startRevision() {
  const pool = buildRevisionPool(CATS);
  if (!pool.length) {
    alert('No words to review yet! Complete a quiz first. 💪');
    return;
  }
  setQuestions(pool.slice(0, Math.min(pool.length, 10)));
  setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
  setTimerMode(false);
  setQuizTitle('Revision mode 📖');
  show('quiz');
}


  // Mode catégorie — choisir une catégorie spécifique
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
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10);
  setQuestions(shuffled);
  setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
  setTimerMode(false);
  setQuizTitle(`${CATS[cat].icon} ${cat}`);
  show('quiz');
}

// Mode mort subite
function startSuddenDeath() {
  const pool = buildPool(CATS, wpc);
  if (!pool.length) return;
  setQuestions(pool.slice(0, 30)); // 30 questions max
  setQIdx(0); setScore(0); setSessionXP(0); setMissedWords([]);
  setTimerMode(false);
  setQuizTitle('💀 Sudden Death');
  show('quiz');
}

// Mode inversé — définition française → trouver le mot anglais
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
      // Sudden death — end quiz immediately after wrong answer
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
  const newStreak = updateStreak(st); // ← doit être ici, AVANT setSt

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

  function onSaveUsername(name) {
    updateSt({ username: name, promptShown: true });
  }

  // Guest skips — mark promptShown so prompt doesn't show again this session
  // but do NOT save to cloud
  function onSkipSave() {
    setSt((prev) => ({ ...prev, promptShown: true }));
  }

  async function handleGoogleLogin() {
    await signInWithGoogle();
  }

  async function handleSignOut() {
    await signOut();
    localStorage.removeItem('toeic_progress');
    localStorage.removeItem('toeic_guest_id');
    setUser(null);
    setSt(INITIAL_STATE);
    setScreen('home');
  }

  if (loadingAuth) {
    return (
      <div className="app loading-screen">
        <div className="loading-dot" />
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
    startRevision,
    startCategoryQuiz,
    startSuddenDeath,
    startReversedQuiz,
    darkMode, setDarkMode,
  };

    if (showSplash) {
    return (
      <div className="splash">
        <div className="splash-content">
          <div className="splash-logo">TOEIC Prep</div>
          <div className="splash-emoji">🎯</div>
          <h1 className="splash-title">Prépare ton TOEIC<br/>sans stress</h1>
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
            onClick={() => {
              localStorage.setItem('toeic_visited', 'true');
              setShowSplash(false);
            }}
          >
            Commencer gratuitement →
          </button>
          <p className="splash-note">Aucune inscription requise pour commencer</p>
        </div>
      </div>
    );
  }
  return (
    
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {screen === 'home' && <Home {...props} />}
      {screen === 'vocab' && <Vocab {...props} />}
      {screen === 'vocab-list' && <VocabList {...props} />}
      {screen === 'quiz' && <Quiz {...props} />}
      {screen === 'result' && <Result {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} />}

      {/* Bottom navbar — hidden during quiz */}
    {screen !== 'quiz' && (
  <nav className="bottom-nav">
    <button
      className={`nav-item${screen === 'home' ? ' active' : ''}`}
      onClick={() => show('home')}
    >
      <span className="nav-icon">🏠</span>
      <span className="nav-label">Home</span>
    </button>
    <button
      className={`nav-item${screen === 'vocab' || screen === 'vocab-list' ? ' active' : ''}`}
      onClick={() => show('vocab')}
    >
      <span className="nav-icon">📚</span>
      <span className="nav-label">Vocab</span>
    </button>
    <button
      className="nav-item nav-quiz-btn"
      onClick={() => startQuiz(false)}
    >
      <span className="nav-icon">⚡</span>
      <span className="nav-label">Quiz</span>
    </button>
    <button
      className="nav-item"
      onClick={startRevision}
    >
      <span className="nav-icon">📖</span>
      <span className="nav-label">Révision</span>
    </button>
    <button
      className={`nav-item${screen === 'leaderboard' ? ' active' : ''}`}
      onClick={() => show('leaderboard')}
    >
      <span className="nav-icon">🏆</span>
      <span className="nav-label">Rankings</span>
    </button>
  </nav>
)}
      
    </div>
  );
}