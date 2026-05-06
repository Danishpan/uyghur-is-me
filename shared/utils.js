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

/* ── Uyghur Cyrillic keyboard rows ─────────────────────
   Standard layout used across all games that need a virtual keyboard.
   Import this constant instead of re-typing it.
   ──────────────────────────────────────────────────── */
const UG_KEYBOARD_ROWS = [
  ['Й','Ц','У','Ү','К','Қ','Е','Н','Ң','Г','Ғ'],
  ['Ш','А','Ә','В','П','Р','О','Ө','Л','Д','Ж','Х'],
  ['Ф','Я','Ч','С','М','И','Т','Б','Ю','Э','Ы','Ь','Һ','З'],
  ['ENTER', '⌫'],
];

/* ── buildKeyboard ──────────────────────────────────────
   Renders a virtual Cyrillic keyboard into #keyboard.
   onKey(letter) is called on every keypress.
   enterLabel defaults to 'КИРИШ'.

   Returns an object with:
     setLetterState(letter, state)  — 'correct'|'present'|'absent'
     reset()                        — clear all states

   Usage:
     const kb = buildKeyboard(letter => handleKey(letter));
     kb.setLetterState('А', 'correct');
   ──────────────────────────────────────────────────── */
function buildKeyboard(onKey, enterLabel = 'КИРИШ') {
  const container = document.getElementById('keyboard');
  if (!container) { console.warn('buildKeyboard(): no #keyboard element'); return; }
  container.innerHTML = '';

  const keyEls = {}; // letter → button element
  const STATE_PRIORITY = { correct: 3, present: 2, absent: 1 };

  UG_KEYBOARD_ROWS.forEach(row => {
    const div = document.createElement('div');
    div.className = 'kb-row';
    row.forEach(k => {
      const btn = document.createElement('button');
      const isWide = k === 'ENTER' || k === '⌫';
      btn.className   = 'key' + (isWide ? ' wide' : '');
      btn.textContent = k === 'ENTER' ? enterLabel : k;
      btn.dataset.key = k;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); onKey(k); });
      div.appendChild(btn);
      if (!isWide) keyEls[k] = btn;
    });
    container.appendChild(div);
  });

  return {
    setLetterState(letter, state) {
      const btn = keyEls[letter];
      if (!btn) return;
      const cur = btn.dataset.state;
      if (!cur || STATE_PRIORITY[state] > STATE_PRIORITY[cur]) {
        btn.dataset.state = state;
      }
    },
    reset() {
      Object.values(keyEls).forEach(btn => delete btn.dataset.state);
    },
  };
}
