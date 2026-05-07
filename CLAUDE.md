# Уйғур SuperApp — Project Bible for Claude

## What this project is
A web-based Uyghur cultural superapp, built as a collection of standalone single-file HTML mini-games and tools. Target audience: Uyghur diaspora (Central Asia, China, Europe, North America). Current phase: prototype web games before deciding on mobile.

## Tech stack
- **Pure vanilla HTML/CSS/JS** — no frameworks, no build step, no npm
- **Each game = one self-contained `.html` file** (easier to share, no server needed)
- **Shared assets** live in `shared/` and are referenced by relative path:
  - `shared/theme.css` — dark theme variables, reset, header, modal, toast, buttons
  - `shared/utils.js` — `toast()`, `openModal()`, `closeModal()`, `Stats` class
- **Game template**: `template-game.html` — copy this to start any new mini-game

## File map
```
Uighur SuperApp/
├── CLAUDE.md               ← you are here
├── index.html              ← game hub / landing page
├── template-game.html      ← copy this for every new game
├── wordle-uyghur.html      ← Wordle (complete, working)
├── spelling-bee.html       ← Spelling Bee / Арылар Уяси (complete, working)
├── flashcards-uyghur.html  ← Flashcards / Сөз Карталири (complete, working)
└── shared/
    ├── theme.css           ← shared dark theme + components
    └── utils.js            ← shared JS utilities
```

---

## Script: Uyghur Cyrillic (Kazakhstan dialect)

### Special letters — always use the Cyrillic codepoint, never the Latin lookalike
| Letter | Unicode  | Wrong lookalike | Notes |
|--------|----------|-----------------|-------|
| Ғ ғ   | U+0492/3 | G g             | Ghayn |
| Қ қ   | U+049A/B | K k             | Qoph  |
| Ң ң   | U+04A2/3 | N n             | Ng    |
| Ө ө   | U+04E8/9 | O o             | Oe    |
| Ү ү   | U+04AE/F | Y y             | Ue    |
| Ә ә   | U+04D8/9 | A a             | Ae    |
| Һ һ   | U+04BA/B | **H h (DANGER)**| Ha — Latin H looks identical! |

**The most common bug**: typing Latin `H` (U+0048) instead of Cyrillic `Һ` (U+04BA).
Always verify with: `[...word].map(c => c.codePointAt(0).toString(16))`.

### Uyghur vs Kazakh — do NOT mix these up
Uyghur Cyrillic and Kazakh Cyrillic share many letters but differ in vocabulary and some letters.
Kazakh-only letters to avoid in Uyghur text: **І і** (U+0406/56), **Ұ ұ** (U+04B0/1).

### Keyboard rows (Uyghur Cyrillic virtual keyboard)
```javascript
[
  ['Й','Ц','У','Ү','К','Қ','Е','Н','Ң','Г','Ғ'],
  ['Ш','А','Ә','В','П','Р','О','Ө','Л','Д','Ж','Х'],
  ['Ф','Я','Ч','С','М','И','Т','Б','Ю','Э','Ы','Ь','Һ','З'],
  ['ENTER', '⌫'],
]
```

### Cyrillic regex for physical keyboard input
```javascript
// Covers all standard Cyrillic + Uyghur extensions (Ғ Қ Ң Ө Ү Ә Һ etc.)
function isCyrillic(ch) {
  return ch.length === 1 && ch.codePointAt(0) >= 0x0400 && ch.codePointAt(0) <= 0x04FF;
}
```

---

## Global Orthography Rules

### 1. Һ vs Х
- Use **Һ** (U+04BA) for native Uyghur words: е.g., **һәрп** (letter), **шаһ** (king)
- Use **Х** only for specific roots (e.g., **хата** = mistake) or established foreign loanwords
- Never confuse Cyrillic **Һ** (U+04BA) with Latin **H** (U+0048) — they look identical

### 2. Correct plural/possessive affixes in titles
- Use **-лири** (not generic **-лар**) for titles and labels: e.g., **оюнлири**, **картилири**, **сөзлири**

### 3. Eliminate Kazakhisms — key substitutions
| Context | ❌ Incorrect (Kazakh/error) | ✅ Correct Uyghur (Cyrillic) |
|---------|--------------------------|----------------------------|
| Hub title | Уйғур Оюнлар | Уйғур оюнлири |
| Mini-games collection subtitle | МИН-ОЮНЛАР ТОПЛИМИ | КИЧИК ОЮНЛАР ТОПЛИМИ |
| Spelling Bee name | Арылар уясы | Арилар Уяси |
| Letter (alphabet) | Харф / Харп | Һәрп |
| Mini (prefix) | Мин- | Кичик / Мини- |
| Lines (crossword) | Ипақлар | Сизиқлар |
| Middle / Center | Ортидики | Оттуридики |
| Status badge (live/active) | Жанды | Ашиқ |
| Select (theme picker) | Тандап / тандаңиз | Таллап / таллаңиз |
| Attempts | Уруниш | Уриниш |
| Yellow (color in game) | Сары | Сериқ |
| Green (color in game) | Яшил | Йешил |
| Flash (cards) | Флаш | Флеш |

### 4. Corrected game UI descriptions
- **Wordle**: `6 уриништа 5 һәрплик сөзни тап. Йешил — тоғра орун, сериқ — бар бирақ орни хата.`
- **Word Cards**: `Флеш картилар арқилиқ йеңи сөзләрни үгән. Тема таллап, тәкрарлаш системиси билән.`
- **Crossword**: `Уйғур сөзлирини тап: горизонтал вә вертикал сизиқлар бойичә тоғра һәрпләрни кириштүрүш.`

---

## UI text — always use Uyghur, never Kazakh

| Concept           | ✅ Uyghur Cyrillic     | ❌ Kazakh (wrong)    |
|-------------------|----------------------|---------------------|
| New game          | Йеңи оюн            | Жаңа ойын           |
| All games (stat)  | Барлиқ оюн          | Барлық ойын         |
| Win (stat)        | Утуш                | Жеңіс               |
| Streak (stat)     | Кетма-кет           | Қатар жеңіс         |
| Amazing!          | Аҗайип!             | Тамаша!             |
| Great!            | Зор!                | Керемет!            |
| Good!             | Яхши!               | Жақсы!              |
| Correct!          | Тоғра!              | Дұрыс!              |
| Failed            | Болмиди             | Жарамады            |
| Language          | тили                | тілі                |
| Enter (keyboard)  | КИРИШ               | —                   |
| 5 letters needed  | 5 һәрп болуши керек | 5 әріп енгізіңіз   |
| Word not in list  | Бундақ сөз йоқ      | Сөз тізімде жоқ    |
| Status badge      | АШИҚ                | ЖАНДЫ               |
| Select (picker)   | таллаңиз            | тандаңиз            |

**Word meanings**: always show in **Russian** (not Kazakh, not English).

---

## Design system (CSS variables — defined in shared/theme.css)
```css
--green:   #538d4e   /* correct letter */
--yellow:  #b59f3b   /* present, wrong position */
--gray:    #3a3a3c   /* absent */
--key-bg:  #818384   /* keyboard key default */
--bg:      #121213   /* page background */
--surface: #1a1a1b   /* modal/card background */
--border:  #3a3a3c   /* borders */
--text:    #ffffff
--subtext: #818384
```

---

## shared/utils.js API

```javascript
// Show a temporary toast notification
toast('Аҗайип! 🎉');
toast('5 һәрп болуши керек', 3000); // custom duration ms

// Stats — persisted to localStorage
const stats = new Stats('game-key'); // unique key per game
stats.recordWin();
stats.recordLoss();
// stats.played, stats.wins, stats.streak

// Modal helpers
openModal();   // adds .open to #overlay
closeModal();  // removes .open from #overlay
```

---

## Wordle-specific constants (wordle-uyghur.html)
- 25 answer words, 5 letters each, all verified Cyrillic
- Soft dictionary validation (any 5 Cyrillic letters accepted as guess)
- Flip stagger: 320ms per tile, flip duration: 500ms
- Stats stored in localStorage key: `'wy-stats'`
- To enable strict dictionary: uncomment the `if (!VALID.has(word))` block

---

## Spelling Bee notes (spelling-bee.html)
- Title: **Арилар Уяси** ("Bee Hive") · subtitle: ОТТУРИДИКИ ҺӘРПНИ ИШЛИТ 🐝
- NYT Spelling Bee mechanic: one centre letter + 6 surrounding letters, make words using the centre letter
- Centre letter called **оттуридики** (not **ортидики**)
- Found-words panel labelled **Тапқан сөзлирим** ("My found words")
- Puzzle words stored per-puzzle with their Uyghur meanings; `c.title` holds the word meaning

---

## Flashcards notes (flashcards-uyghur.html)
- Title: **Сөз Карталири** ("Word Cards") · subtitle: Флаш карталар · Уйғур тили
- Spaced-repetition system: progress persisted in localStorage under key `'fc-sr'`
- Words organised into **CATEGORIES** array — to add a category, push a new object to `CATEGORIES`
- Category stats helper: `getCatStats(cat)` returns `{ due, mastered, total }`
- Progress saved via `saveProgress()` after every card rating
- Completion screen shows **Аҗайип!** toast

---

## How to add a new mini-game (checklist)
1. `cp template-game.html my-game.html`
2. Fill in `GAME_TITLE`, `GAME_SUBTITLE`, game board HTML, game JS logic
3. Word/content lists: 5 Uyghur letters each, run the verification snippet below
4. All UI text must be Uyghur Cyrillic (see table above)
5. Use `toast()` and `Stats` from `shared/utils.js` — don't rewrite them

### Verification snippet (paste into node to check word lists)
```javascript
const words = ['КИТАП', 'АРМАН']; // your list
words.forEach(w => {
  const chars = [...w];
  const len = chars.length;
  const latin = chars.filter(c => c.codePointAt(0) < 0x0400);
  console.log(`${len===5 && !latin.length ? '✅' : '❌'} ${w} (${len})${latin.length ? ' LATIN: '+latin : ''}`);
});
```

---

## Known pitfalls / lessons learned
1. **Latin H in ШӘҺӘР** — was `ШӘHӘР` (Latin H). Always verify with codepoints.
2. **Kazakh UI strings** — first draft used Kazakh. See UI text table above.
3. **ДАРЬЯ** — contains soft sign Ь (U+042C), not Й. Valid 5-char word but verify pronunciation with native speaker.
4. **Word meanings** were Kazakh in v1. Keep meanings English only.
5. **Tile flip timing**: set `data-state` at `FLIP_MS / 2` ms into the animation so colour appears at the invisible midpoint.
