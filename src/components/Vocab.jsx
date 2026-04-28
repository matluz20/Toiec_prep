import React from 'react';

export default function Vocab({ show, CATS, wpc, setCurrentCat }) {
  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div>
          <div className="ph-title">Vocabulary</div>
          <div className="ph-sub">{wpc}/12 words unlocked per category</div>
        </div>
      </div>
      <div className="cat-grid">
        {Object.entries(CATS).map(([name, { icon, words }]) => {
          const unl = Math.min(wpc, words.length);
          const locked = words.length - unl;
          return (
            <div
              key={name}
              className="cat-card"
              onClick={() => { setCurrentCat(name); show('vocab-list'); }}
            >
              <div className="cat-ic">{icon}</div>
              <div className="cat-n">{name}</div>
              <div className="cat-c">{unl}/{words.length} words unlocked</div>
              {locked > 0 && <div className="cat-lock">🔒 {locked} locked</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}