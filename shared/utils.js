/* ═══════════════════════════════════════════════════════
   Уйғур SuperApp — Shared JS Utilities
   Include in every game:
     <script src="../shared/utils.js"></script>
   (or "shared/utils.js" if game is in root)
   ═══════════════════════════════════════════════════════ */

/* ── Toast ──────────────────────────────────────────────
   Usage: toast('Аҗайип! 🎉');
          toast('Хата болди', 3000);
   ──────────────────────────────────────────────────── */
function toast(msg, ms = 2200) {
  const container = document.getElementById('toasts');
  if (!container) { console.warn('toast(): no #toasts element'); return; }
  const el = document.createElement('div');
  el.className   = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ── Modal ──────────────────────────────────────────────
   Usage: openModal();  closeModal();
   Expects #overlay in the HTML.
   ──────────────────────────────────────────────────── */
function openModal()  { document.getElementById('overlay')?.classList.add('open');    }
function closeModal() { document.getElementById('overlay')?.classList.remove('open'); }

/* ── Stats ──────────────────────────────────────────────
   Persists win/loss/streak to localStorage.

   Usage:
     const stats = new Stats('wordle');   // unique key per game
     stats.recordWin();
     stats.recordLoss();
     console.log(stats.played, stats.wins, stats.streak);
     stats.renderTo('s-played', 's-wins', 's-streak'); // fills DOM spans
   ──────────────────────────────────────────────────── */
class Stats {
  constructor(gameKey) {
    this._key = `ug-stats-${gameKey}`;
    const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
    this.played = saved?.played ?? 0;
    this.wins   = saved?.wins   ?? 0;
    this.streak = saved?.streak ?? 0;
  }
  recordWin()  { this.played++; this.wins++;   this.streak++; this._save(); }
  recordLoss() { this.played++; this.streak=0; this._save(); }
  _save() { localStorage.setItem(this._key, JSON.stringify({ played: this.played, wins: this.wins, streak: this.streak })); }
  /** Writes numbers into DOM elements by id. Pass null to skip a slot. */
  renderTo(playedId, winsId, streakId) {
    if (playedId) document.getElementById(playedId).textContent = this.played;
    if (winsId)   document.getElementById(winsId).textContent   = this.wins;
    if (streakId) document.getElementById(streakId).textContent = this.streak;
  }
}

/* ── Cyrillic input helper ──────────────────────────────
   Returns true for any single Uyghur Cyrillic character
   (covers standard Cyrillic U+0400–04FF including Ғ Қ Ң Ө Ү Ә Һ).
   ──────────────────────────────────────────────────── */
function isCyrillic(ch) {
  return ch.length === 1 && ch.codePointAt(0) >= 0x0400 && ch.codePointAt(0) <= 0x04FF;
}

/* ── animOnce ───────────────────────────────────────────
   Add a CSS animation class, remove it when done.
   Usage: animOnce(el, 'shake');
   ──────────────────────────────────────────────────── */
function animOnce(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so re-adding works
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/* ── Back-button smooth exit ────────────────────────────
   Intercepts .btn-back clicks, fades the page out, then navigates.
   Also resets opacity on bfcache restore (back button returns a frozen page).
   ──────────────────────────────────────────────────── */
window.addEventListener('pageshow', () => {
  document.body.style.transition = '';
  document.body.style.opacity = '1';
});

function _initBackButtons() {
  document.querySelectorAll('.btn-back').forEach(btn => {
    if (btn.dataset.backBound) return;           // prevent double-binding
    btn.dataset.backBound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      const href = btn.getAttribute('href');
      document.body.style.transition = 'opacity 0.18s ease';
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 180);
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initBackButtons);
} else {
  _initBackButtons(); // DOM already ready (utils.js loaded at bottom of body)
}

/* ── UyghurKeyboard ─────────────────────────────────────
   Supplemental keyboard strip for Uyghur Cyrillic input.
   Shows the 8 letters absent from standard Russian keyboards
   (Ә Ғ Қ Ң Ө Ү Һ Җ), plus ⌫ and (optionally) КИРИШ.
   Also manages a ghost <input> for mobile native keyboard capture.

   CSS lives in shared/theme.css (.ug-* classes).

   Usage:
     const kb = new UyghurKeyboard({
       onLetter: ch => handleKey(ch),   // required
       onDelete: ()  => handleKey('⌫'), // required
       onEnter:  ()  => submitGuess(),  // optional — shows КИРИШ if provided
     });
     kb.mount(document.getElementById('keyboard'));

     // Color tracking (Wordle-style, priority: correct > present > absent):
     kb.setKeyState('Ғ', 'correct');   // state: 'correct'|'present'|'absent'
     kb.resetKeyStates();              // call on new game

     // Focus ghost input (Crossword — call after selecting a cell):
     kb.focus();
   ──────────────────────────────────────────────────── */
const UG_SPECIAL_LETTERS = ['Ә','Ғ','Қ','Ң','Ө','Ү','Һ','Җ'];
const _KB_PRIORITY = { correct: 3, present: 2, absent: 1 };

class UyghurKeyboard {
  constructor({ onLetter, onDelete, onEnter } = {}) {
    this._onLetter = onLetter;
    this._onDelete = onDelete;
    this._onEnter  = onEnter;   // undefined/null → no КИРИШ button
    this._keyEls   = {};        // letter → <button>
    this._ghost    = null;
    this._boundOnInput = null;
  }

  /** Build and insert the keyboard UI into `container` (Element or CSS selector). */
  mount(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) { console.warn('UyghurKeyboard.mount(): container not found'); return; }
    container.innerHTML = '';
    this._keyEls = {};

    // ── Ghost input (off-screen; captures native keyboard on mobile) ──
    let ghost = document.getElementById('ug-ghost-input');
    if (!ghost) {
      ghost = document.createElement('input');
      ghost.id = 'ug-ghost-input';
      ghost.setAttribute('type',            'text');
      ghost.setAttribute('inputmode',       'text');
      ghost.setAttribute('autocomplete',    'off');
      ghost.setAttribute('autocorrect',     'off');
      ghost.setAttribute('autocapitalize',  'characters');
      ghost.setAttribute('spellcheck',      'false');
      ghost.setAttribute('style',
        'position:fixed;top:-120px;left:-120px;width:1px;height:1px;' +
        'opacity:0;border:none;outline:none;font-size:16px;pointer-events:none');
      document.body.appendChild(ghost);
    }
    this._ghost = ghost;
    // Re-bind so a second mount() call works correctly
    if (this._boundOnInput) ghost.removeEventListener('input', this._boundOnInput);
    this._boundOnInput = this._onGhostInput.bind(this);
    ghost.addEventListener('input', this._boundOnInput);

    // ── Hint text (desktop) ────────────────────────────
    const hint = document.createElement('p');
    hint.className   = 'ug-kb-hint';
    hint.textContent = '⌨️  Тастатурадин язиңиз';
    container.appendChild(hint);

    // ── Key strip ─────────────────────────────────────
    const row = document.createElement('div');
    row.className = 'ug-kb-row';
    const keys = this._onEnter
      ? [...UG_SPECIAL_LETTERS, '⌫', 'КИРИШ']
      : [...UG_SPECIAL_LETTERS, '⌫'];

    keys.forEach(k => {
      const isAction = k === '⌫' || k === 'КИРИШ';
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'ug-key' + (isAction ? ' wide' : '');
      btn.textContent = k;
      btn.dataset.key = k;
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if      (k === 'КИРИШ') this._onEnter?.();
        else if (k === '⌫')    this._onDelete?.();
        else                    this._onLetter?.(k);
      });
      row.appendChild(btn);
      if (!isAction) this._keyEls[k] = btn;
    });
    container.appendChild(row);

    // ── Tap-to-type button (shown on touch devices via CSS) ──
    const tapBtn = document.createElement('button');
    tapBtn.type        = 'button';
    tapBtn.className   = 'ug-btn-tap-type';
    tapBtn.textContent = '⌨️  Тастатура';
    tapBtn.addEventListener('click', () => this.focus());
    container.appendChild(tapBtn);
  }

  _onGhostInput() {
    const val = this._ghost.value;
    this._ghost.value = '';
    for (const rawCh of val) {
      const ch = rawCh.toUpperCase();
      if (isCyrillic(ch)) this._onLetter?.(ch);
    }
  }

  /** Focus the ghost input to open the native keyboard on mobile. */
  focus() {
    if (!this._ghost) return;
    this._ghost.style.pointerEvents = 'auto';
    this._ghost.focus({ preventScroll: true });
    this._ghost.value = '';
    this._ghost.style.pointerEvents = 'none';
  }

  /**
   * Set the color state for a special-letter key.
   * Uses priority: correct (3) > present (2) > absent (1) — never downgrade.
   * @param {string} letter  - one of UG_SPECIAL_LETTERS
   * @param {string} state   - 'correct' | 'present' | 'absent'
   */
  setKeyState(letter, state) {
    const btn = this._keyEls[letter];
    if (!btn) return;
    const cur = btn.dataset.state;
    if (!cur || (_KB_PRIORITY[state] ?? 0) > (_KB_PRIORITY[cur] ?? 0)) {
      btn.dataset.state = state;
    }
  }

  /** Clear all key color states — call at the start of a new game. */
  resetKeyStates() {
    Object.values(this._keyEls).forEach(btn => { btn.dataset.state = ''; });
  }

  /** Remove the ghost input and unbind its listener. */
  destroy() {
    if (this._ghost && this._boundOnInput) {
      this._ghost.removeEventListener('input', this._boundOnInput);
      this._ghost.remove();
      this._ghost = null;
    }
  }
}

/* ── decodeGameData ─────────────────────────────────────
   Decodes a game data blob from window.__GAME_DATA__.
   The blob is produced by scripts/encode-data.js:
     JSON → UTF-8 bytes → XOR with 'уйғур' UTF-8 → base64.

   Usage (after loading the matching data/*.js file):
     const WORDS = decodeGameData('wordle');

   Returns the original JS value (array/object), or []
   if the key is missing (safe fallback so game still loads).
   ──────────────────────────────────────────────────── */
function decodeGameData(key) {
  const b64 = (window.__GAME_DATA__ || {})[key];
  if (!b64) { console.error('decodeGameData: missing key "' + key + '"'); return []; }
  // UTF-8 bytes of the XOR key string 'уйғур'
  const KEY = [0xD1,0x83,0xD0,0xB9,0xD2,0x93,0xD1,0x83,0xD1,0x80];
  const raw   = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const plain = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) plain[i] = bytes[i] ^ KEY[i % KEY.length];
  return JSON.parse(new TextDecoder().decode(plain));
}
