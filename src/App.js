import React, { useState, useEffect } from 'react';
import './App.css';
import { CATS, LEVELS, BADGES, FAKE_PLAYERS } from './data/words';
import { getLvl, getWPC, getUnlockedCount, speak, buildPool, saveProgress, loadProgress } from './utils/helpers';
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
    saveProgress(st);
  }, [st]);

  const lvl = getLvl(st.xp, LEVELS);
  const wpc = getWPC(st.xp, LEVELS);
  const unlockedCount = getUnlockedCount(st.xp, LEVELS, CATS);

  function updateSt(patch) {
    setSt((prev) => ({ ...prev, ...patch }));
  }

  function checkBadges(currentSt) {
    const updated = [...currentSt.earnedBadges];
    BADGES.forEach((b) => {
      if (
        !updated.includes(b.id) &&
        b.cond({
          ...currentSt,
          unlockedCount: getUnlockedCount(currentSt.xp, LEVELS, CATS),
        })
      ) {
        updated.push(b.id);
      }
    });
    return { earnedBadges: updated };
  }

  function show(id) {
    setScreen(id);
  }

  function startQuiz(chrono) {
    const pool = buildPool(CATS, wpc);
    if (!pool.length) return;
    setQuestions(pool.slice(0, 10));
    setQIdx(0);
    setScore(0);
    setSessionXP(0);
    setMissedWords([]);
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
    setQIdx(0);
    setScore(0);
    setSessionXP(0);
    setMissedWords([]);
    setTimerMode(false);
    setQuizTitle('Daily challenge 💪');
    show('quiz');
  }

  function onAnswer({ correct, xpGained, word, def, fast }) {
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
    }
  }

  function onNextQ() {
    if (qIdx + 1 >= questions.length) {
      onQuizEnd();
    } else {
      setQIdx((i) => i + 1);
    }
  }

  function onQuizEnd() {
    const finalScore = score;
    const isChallenge = quizTitle.includes('challenge');

    setSt((prev) => {
      const newBestScore =
        prev.bestScore === null || finalScore > prev.bestScore
          ? finalScore
          : prev.bestScore;
      const newQuizzes = prev.quizzes + 1;
      const newPerfect =
        finalScore === questions.length
          ? prev.perfectScores + 1
          : prev.perfectScores;

      const updatedSt = {
        ...prev,
        quizzes: newQuizzes,
        bestScore: newBestScore,
        perfectScores: newPerfect,
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

  const props = {
    st,
    updateSt,
    show,
    speak,
    CATS,
    LEVELS,
    BADGES,
    FAKE_PLAYERS,
    lvl,
    wpc,
    unlockedCount,
    currentCat,
    setCurrentCat,
    questions,
    qIdx,
    score,
    sessionXP,
    timerMode,
    missedWords,
    quizTitle,
    onAnswer,
    onNextQ,
    onSaveUsername,
    onSkipSave,
    lbTab,
    setLbTab,
    startQuiz,
    startChallenge,
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