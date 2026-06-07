import React, { useState } from 'react';
import { EPISODES, LISTEN_CATEGORIES } from '../data/listenData';

const SOURCE_COLORS = {
  VOA: { bg: '#E6F1FB', color: '#185FA5' },
  BBC: { bg: '#FAECE7', color: '#993C1D' },
  TED: { bg: '#EEEDFE', color: '#534AB7' },
};

export default function Listen({ show, isPremium }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openEp, setOpenEp] = useState(null);

  const filtered = activeCategory === 'All'
    ? EPISODES
    : EPISODES.filter((e) => e.category === activeCategory);

  function handleOpen(ep) {
    if (ep.premium && !isPremium) {
      setOpenEp('locked');
      return;
    }
    setOpenEp(ep.id === openEp ? null : ep.id);
  }

  return (
    <div>
      <div className="ph">
        <button className="back" onClick={() => show('home')}>←</button>
        <div>
          <div className="ph-title">🎧 Listen & Learn</div>
          <div className="ph-sub">Real English · TOEIC vocabulary</div>
        </div>
      </div>

      {/* Category filters */}
      <div className="listen-filters">
        {LISTEN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`listen-filter-btn${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Premium banner */}
      {!isPremium && (
        <div className="listen-premium-banner">
          <span>🔒 Unlock all episodes with Premium</span>
          <button className="listen-premium-cta">Unlock →</button>
        </div>
      )}

      {/* Episodes list */}
      <div className="listen-list">
        {filtered.map((ep) => {
          const locked = ep.premium && !isPremium;
          const isOpen = openEp === ep.id;
          const src = SOURCE_COLORS[ep.source] || SOURCE_COLORS.VOA;

          return (
            <div
              key={ep.id}
              className={`listen-item${locked ? ' locked' : ''}${isOpen ? ' open' : ''}`}
              onClick={() => handleOpen(ep)}
            >
              <div className="listen-item-row">
                <div
                  className="listen-item-icon"
                  style={{ background: locked ? 'var(--bg-secondary)' : src.bg }}
                >
                  <span style={{ fontSize: 18 }}>{locked ? '🔒' : '▶'}</span>
                </div>
                <div className="listen-item-info">
                  <div className="listen-item-title">{ep.title}</div>
                  <div className="listen-item-meta">
                    <span
                      className="listen-source-badge"
                      style={{ background: src.bg, color: src.color }}
                    >
                      {ep.source}
                    </span>
                    <span>{ep.duration}</span>
                    <span>·</span>
                    <span>{ep.words.length} TOEIC words</span>
                    {locked && (
                      <span className="listen-pro-badge">Pro</span>
                    )}
                  </div>
                </div>
                <span className={`listen-chevron${isOpen ? ' up' : ''}`}>›</span>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div className="listen-expanded">
                  <p className="listen-desc">{ep.description}</p>
                  <div className="listen-words-wrap">
                    <div className="listen-words-label">TOEIC words in this episode</div>
                    <div className="listen-words-list">
                      {ep.words.map((w) => (
                        <span key={w} className="listen-word-chip">{w}</span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={ep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="listen-open-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open on {ep.source} →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Locked modal */}
      {openEp === 'locked' && (
        <div className="listen-lock-overlay" onClick={() => setOpenEp(null)}>
          <div className="listen-lock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="listen-lock-icon">🔒</div>
            <div className="listen-lock-title">Premium content</div>
            <div className="listen-lock-desc">
              Unlock all episodes, remove ads and access the full vocabulary library.
            </div>
            <button className="listen-unlock-btn">Unlock Premium · 9,99€</button>
            <button className="listen-lock-skip" onClick={() => setOpenEp(null)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
