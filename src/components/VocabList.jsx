import React, { useState } from 'react';

export default function VocabList({ show, speak, CATS, LEVELS, wpc, currentCat, st }) {
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  if (!currentCat || !CATS[currentCat]) return null;

  const words = CATS[currentCat].words;
  const unlocked = words.slice(0, wpc);
  const locked = words.slice(wpc);
  const nxtXP = st && LEVELS[LEVELS.findIndex((l) => l.wpc > wpc)]
    ? LEVELS[LEVELS.findIndex((l) => l.wpc > wpc)].xp - st.xp
    : 0;

  const q = search.toLowerCase().trim();
  const filtered = q
    ? unlocked.filter(
        (w) =>
          w.w.toLowerCase().includes(q) ||
          w.d.toLowerCase().includes(q) ||
          w.dfr.toLowerCase().includes(q)
      )
    : unlocked;

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('vocab')}>←</button>
        <div>
          <div className="ph-title">{CATS[currentCat].icon} {currentCat}</div>
          <div className="ph-sub">{unlocked.length}/{words.length} words unlocked · tap to expand</div>
        </div>
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search a word..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="vlist">
        {filtered.map((item, i) => (
          <div
            key={item.w}
            className={`vi${openIdx === i ? ' open' : ''}`}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div className="vi-top">
              <div className="vi-left">
                <span className="vi-word">{item.w}</span>
                <span className="vi-type">{item.t}</span>
              </div>
              <button
                className="vi-spk"
                onClick={(e) => { e.stopPropagation(); speak(item.w); }}
              >🔊</button>
            </div>
            <div className="vi-def">{item.d}</div>
            <div className="vi-dfr">{item.dfr}</div>
            {openIdx === i && (
              <div className="vi-ex">
                {item.e}
                <button
                  className="vi-spk"
                  style={{ marginLeft: 6 }}
                  onClick={(e) => { e.stopPropagation(); speak(item.e); }}
                >🔊</button>
              </div>
            )}
          </div>
        ))}

        {!q && locked.map((_, i) => (
          <div key={i} className="locked-vi">
            <div style={{ fontSize: 16 }}>🔒</div>
            <div>
              <div className="locked-vi-t">Locked word</div>
              <div className="locked-vi-h">
                {nxtXP > 0 ? `${nxtXP} more XP to unlock` : 'Max level reached'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}