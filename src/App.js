import React, { useState, useEffect } from 'react';
import './App.css';
import { CATS, LEVELS, BADGES, FAKE_PLAYERS } from './data/words';
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProgressFromCloud(session.user.id).then((data) => {
          if (data) {
            const cloudSt = {
              xp: data.xp || 0,
              streak: data.streak || 0,
              quizzes: data.quizzes || 0,
              bestScore: data.best_score || null,
              earnedBadges: data.earned_badges || [],
              username: data.username || session.user.user_metadata?.full_name || null,
              promptShown: true,
              challengeDone: data.challenge_done || false,
              perfectScores: data.perfect_scores || 0,
              fastAnswers: data.fast_answers || 0,
            };
            setSt(cloudSt);
            saveProgress(cloudSt);
          }
        });
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProgressFromCloud(session.user.id).then((data) => {
          if (data) {
            const cloudSt = {
              xp: data.xp || 0,
              streak: data.streak || 0,
              quizzes: data.quizzes || 0,
              bestScore: data.best_score || null,
              earnedBadges: data.earned_badges || [],
              username: data.username || session.user.user_metadata?.full_name || null,
              promptShown: true,
              challengeDone: data.challenge_done || false,
              perfectScores: data.perfect_scores || 0,
              fastAnswers: data.fast_answers || 0,
            };
            setSt(cloudSt);
            saveProgress(cloudSt);
          } else {
            const local = loadProgress();
            if (local) {
              saveProgressToCloud(session.user.id, {
                xp: local.xp,
                streak: local.streak,
                quizzes: local.quizzes,
                best_score: local.bestScore,
                earned_badges: local.earnedBadges,
                username: local.username || session.user.user_metadata?.full_name,
                challenge_done: local.challengeDone,
                perfect_scores: local.perfectScores,
                fast_answers: local.fastAnswers,
              }, false);
              setSt({ ...local, username: local.username || session.user.user_metadata?.full_name, promptShown: true });
            }
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save progress locally + to cloud (Google or guest)
  useEffect(() => {
    saveProgress(st);
    const progressData = {
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
    if (user) {
      // Google user
      saveProgressToCloud(user.id, progressData, false);
    } else if (st.promptShown) {
      // Guest with a username — save to cloud with guest ID
      saveProgressToCloud(getGuestId(), progressData, true);
    }
  }, [st, user]);

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

  function onSaveUsername(name) { updateSt({ username: name, promptShown: true }); }
  function onSkipSave() { updateSt({ promptShown: true }); }
  async function handleGoogleLogin() { await signInWithGoogle(); }
  async function handleSignOut() {
  await signOut();
  // Clear all local data
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
    CATS, LEVELS, BADGES, FAKE_PLAYERS,
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