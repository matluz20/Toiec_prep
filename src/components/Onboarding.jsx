import React, { useState } from 'react';

const STEPS = [
  {
    emoji: '📚',
    title: 'Apprends le vocabulaire TOEIC',
    desc: '500+ mots essentiels organisés par thèmes : Business, Travel, Finance… Débloque de nouveaux mots au fur et à mesure que tu progresses.',
    cta: 'Suivant →',
    color: '#185FA5',
    bg: '#E6F1FB',
    tip: 'Commence par explorer le vocabulaire avant de faire des quiz.',
  },
  {
    emoji: '⚡',
    title: 'Entraîne-toi avec des quiz variés',
    desc: 'QCM, flashcards, mode chrono, Sudden Death… Chaque bonne réponse te rapporte des XP et débloque de nouveaux contenus.',
    cta: 'Suivant →',
    color: '#1D9E75',
    bg: '#E1F5EE',
    tip: 'Le Mixed Quiz est le meilleur point de départ.',
  },
  {
    emoji: '🏆',
    title: 'Monte dans le classement',
    desc: 'Accumule des XP, gagne des badges, maintiens ton streak quotidien. Compare-toi aux autres utilisateurs dans le leaderboard mondial.',
    cta: 'Commencer gratuitement →',
    color: '#854F0B',
    bg: '#FAEEDA',
    tip: 'Reviens chaque jour pour maintenir ton streak 🔥',
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (isLast) {
      onDone();
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setStep((p) => p + 1);
      setExiting(false);
    }, 180);
  }

  function skip() {
    onDone();
  }

  return (
    <div className="onboard-wrap">
      <div className={`onboard-card${exiting ? ' onboard-exit' : ''}`}>

        {/* Skip */}
        {!isLast && (
          <button className="onboard-skip" onClick={skip}>
            Passer
          </button>
        )}

        {/* Step dots */}
        <div className="onboard-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboard-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* Emoji */}
        <div
          className="onboard-emoji-wrap"
          style={{ background: s.bg }}
        >
          <span className="onboard-emoji">{s.emoji}</span>
        </div>

        {/* Text */}
        <h2 className="onboard-title">{s.title}</h2>
        <p className="onboard-desc">{s.desc}</p>

        {/* Tip */}
        <div className="onboard-tip" style={{ borderLeftColor: s.color }}>
          <span className="onboard-tip-icon">💡</span>
          {s.tip}
        </div>

        {/* CTA */}
        <button
          className="onboard-cta"
          style={{ background: s.color }}
          onClick={next}
        >
          {s.cta}
        </button>

        {/* Step counter */}
        <p className="onboard-counter">{step + 1} / {STEPS.length}</p>
      </div>
    </div>
  );
}
