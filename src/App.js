import React, { useState, useEffect } from 'react';
import './App.css';
import { CATS, LEVELS, BADGES } from './data/words';
import { getLvl, getWPC, getUnlockedCount, speak, buildPool, saveProgress, loadProgress } from './utils/helpers';
import { supabase, signInWithGoogle, signOut, saveProgressToCloud, loadProgressFromCloud, getGuestId } from './supabase';
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

function stateFromCloud(data, fallbackName) {
  return {
    xp: data.xp || 0,
    streak: data.streak || 0,
    quizzes: data.quizzes || 0,
    bestScore: data.best_score || null,
    earnedBadges: data.earned_badges || [],
    username: data.username || fallbackName || null,
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
  const [savingCloud, setSavingCloud] = useState(false);

  // Load session on mount
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
      // Cloud data exists — load it
      const cloudSt = stateFromCloud(data, googleUser.user_metadata?.full_name);
      setSt(cloudSt);
      saveProgress(cloudSt);
    } else {
      // First time login — push local progress to cloud
      const local = loadProgress() || INITIAL_STATE;
      const merged = { ...local, promptShown: true };
      setSt(merged);
      saveProgress(merged);
      await saveProgressToCloud(googleUser.id, stateToCloud(merged), false);
    }
  }

  // Auto-save to cloud whenever state changes
  useEffect(() => {
    saveProgress(st);
    if (!savingCloud) {
      setSavingCloud(true);
      const timeout = setTimeout(async () => {
        if (user) {
          await saveProgressToCloud(user.id, stateToCloud(st), false);
        } else if (st.promptShown && st.username) {
          await saveProgressToCloud(getGuestId(), stateToCloud(st), true);
        }
        setSavingCloud(false);
      }, 1000); // debounce 1s
      return () => clearTimeout(timeout);
    }
  }, [st]); // eslint-disable-line react-hooks/exhaustive-deps

  const lvl = getLvl(st.xp, LEVELS);
  const wpc = getWPC(st.xp, LEVELS);
  const unlockedCount = getUnlockedCount(st.xp, LEVELS, CATS);

  function updateSt(patch) {
    setSt((prev) => ({ ...prev, ...patch }));
  }

  function checkBadges(currentSt) {
    const updated = [...currentSt.earnedBadges];
    BADGES.forEach((b) => {
      if (!updated.includes(b.id) && b.cond({ ...currentSt, unlockedCount: getUnlockedCount(currentSt.xp, LEVELS, CATS) })) {
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

  function onAnswer({ correct, xpGained, word, def, fast }) {
    if (correct) {
      setScore((s) => s + 1);
      setSessionXP((s) => s + xpGained);
      setSt((prev) => ({ ...prev, xp: prev.xp + xpGained, fastAnswers: fast ? prev.fastAnswers + 1 : prev.fastAnswers }));
    } else {
      setMissedWords((prev) => [...prev, { word, def }]);
    }
  }

  function onNextQ() {
    if (qIdx + 1 >= questions.length) onQuizEnd();
    else setQIdx((i) => i + 1);
  }

  function onQuizEnd() {
    const finalScore = score;
    const isChallenge = quizTitle.includes('challenge');
    setSt((prev) => {
      const newBestScore = prev.bestScore === null || finalScore > prev.bestScore ? finalScore : prev.bestScore;
      const updatedSt = {
        ...prev,
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

  function onSkipSave() {
    updateSt({ promptShown: true });
  }

  async function handleGoogleLogin() {
    await signInWithGoogle();
  }

  async function handleSignOut() {
    await signOut();
    // Clear everything and reset
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
  };

  return (
    <div className="app">
      {screen === 'home' && <Home {...props} />}
      {screen === 'vocab' && <Vocab {...props} />}
      {screen === 'vocab-list' && <VocabList {...props} />}
      {screen === 'quiz' && <Quiz {...props} />}
      {screen === 'result' && <Result {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} />}
    </div>
  );
}