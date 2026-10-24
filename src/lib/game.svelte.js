import { Chess } from 'chess.js';
import { sfx } from './sound.js';
import { t } from './i18n.svelte.js';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FILES = 'abcdefgh';
const SAVE_KEY = 'gambit.game';
const PREFS_KEY = 'gambit.prefs';
const WORTH = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const THEMES = ['lacquer', 'verdigris', 'parchment'];

export const BANDS = Array.from({ length: 6 }, (_, i) => ({ from: i * 400, to: (i + 1) * 400 }));

export const bandIndex = (elo) => Math.min(BANDS.length - 1, Math.floor(elo / 400));

export const CLOCKS = [
  { id: 'none', label: 'Untimed', base: 0, inc: 0 },
  { id: '1+0', label: '1 min', base: 60, inc: 0 },
  { id: '3+2', label: '3 + 2', base: 180, inc: 2 },
  { id: '5+0', label: '5 min', base: 300, inc: 0 },
  { id: '10+0', label: '10 min', base: 600, inc: 0 },
  { id: '15+10', label: '15 + 10', base: 900, inc: 10 }
];

let nextPieceId = 1;
let nextBurstId = 1;

function parseFen(fen) {
  const map = new Map();
  fen.split(' ')[0].split('/').forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) c += Number(ch);
      else {
        map.set(FILES[c] + (8 - r), { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' });
        c++;
      }
    }
  });
  return map;
}

const distance = (a, b) => Math.max(Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0])), Math.abs(a[1] - b[1]));

// Keeps piece identities stable between positions so the board can animate moves.
function syncPieces(prev, target) {
  const kept = [];
  const free = [];
  const open = new Map(target);
  for (const p of prev) {
    const t = open.get(p.square);
    if (t && t.type === p.type && t.color === p.color) {
      kept.push({ ...p });
      open.delete(p.square);
    } else free.push(p);
  }
  for (const [square, t] of open) {
    let idx = -1;
    let best = Infinity;
    free.forEach((p, i) => {
      if (p.type !== t.type || p.color !== t.color) return;
      const d = distance(p.square, square);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    if (idx >= 0) {
      const [p] = free.splice(idx, 1);
      kept.push({ ...p, square });
    } else kept.push({ id: nextPieceId++, type: t.type, color: t.color, square });
  }
  return kept;
}

class Game {
  chess = new Chess();
  #worker = null;
  #job = 0;
  #started = 0;
  #last = Date.now();

  mode = $state('ai');
  human = $state('w');
  elo = $state(1200);
  clock = $state('none');
  orientation = $state('w');
  moves = $state([]);
  cursor = $state(null);
  pieces = $state([]);
  times = $state({ w: 0, b: 0 });
  result = $state(null);
  thinking = $state(false);
  burst = $state(null);
  muted = $state(false);
  theme = $state(THEMES[0]);

  clockCfg = $derived(CLOCKS.find((c) => c.id === this.clock));
  viewIndex = $derived(this.cursor ?? this.moves.length);
  viewMove = $derived(this.viewIndex > 0 ? this.moves[this.viewIndex - 1] : null);
  viewFen = $derived(this.viewMove ? this.viewMove.after : START);
  turn = $derived(this.moves.length % 2 === 0 ? 'w' : 'b');
  live = $derived(this.cursor === null);
  canMove = $derived(this.live && !this.result && !this.thinking && (this.mode === 'local' || this.turn === this.human));

  checkSquare = $derived.by(() => {
    const m = this.viewMove;
    if (!m || !/[+#]/.test(m.san)) return null;
    const defender = m.color === 'w' ? 'b' : 'w';
    return this.pieces.find((p) => p.type === 'k' && p.color === defender)?.square ?? null;
  });

  captured = $derived.by(() => {
    const out = { w: [], b: [] };
    for (const m of this.moves.slice(0, this.viewIndex)) if (m.captured) out[m.color].push(m.captured);
    for (const side of ['w', 'b']) out[side].sort((a, b) => WORTH[b] - WORTH[a]);
    return out;
  });

  balance = $derived(
    this.captured.w.reduce((n, t) => n + WORTH[t], 0) - this.captured.b.reduce((n, t) => n + WORTH[t], 0)
  );

  outcome = $derived.by(() => {
    const r = this.result;
    if (!r) return null;
    if (!r.winner) return { title: t('draw'), sub: t(`reason.${r.reason}`) };
    const who =
      this.mode === 'ai'
        ? r.winner === this.human
          ? t('youWin')
          : t('engineWins')
        : t(r.winner === 'w' ? 'whiteWins' : 'blackWins');
    return { title: t(`result.${r.reason}`), sub: who };
  });

  constructor() {
    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    this.muted = prefs.muted ?? false;
    this.theme = prefs.theme ?? THEMES[0];

    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const save = JSON.parse(raw);
      this.mode = save.mode;
      this.human = save.human;
      this.elo = save.elo;
      this.clock = save.clock;
      this.orientation = save.orientation;
      for (const san of save.moves) this.moves.push({ ...this.chess.move(san) });
      this.times = save.times;
      this.result = save.result;
    } else {
      const base = this.clockCfg.base * 1000;
      this.times = { w: base, b: base };
    }
    this.#sync();
  }

  resume() {
    this.#last = Date.now();
    this.#maybeAI();
  }

  newGame({ mode, human, elo, clock }) {
    this.#job++;
    this.thinking = false;
    this.chess = new Chess();
    this.mode = mode;
    this.human = human;
    this.elo = elo;
    this.clock = clock;
    this.orientation = mode === 'ai' ? human : 'w';
    this.moves = [];
    this.cursor = null;
    this.result = null;
    this.burst = null;
    const base = this.clockCfg.base * 1000;
    this.times = { w: base, b: base };
    this.#last = Date.now();
    this.#sync();
    this.#save();
    this.#maybeAI();
  }

  legalMoves(square) {
    return this.chess.moves({ square, verbose: true });
  }

  play({ from, to, promotion }) {
    const m = this.chess.move({ from, to, promotion });
    this.tick();
    if (this.clockCfg.inc && this.moves.length >= 2) this.times[m.color] += this.clockCfg.inc * 1000;
    this.moves.push({ ...m });
    this.cursor = null;
    this.#last = Date.now();
    this.#sync();

    const opponent = m.color === 'w' ? 'b' : 'w';
    const check = this.chess.isCheck();
    const mate = this.chess.isCheckmate();

    if (mate) this.result = { winner: m.color, reason: 'checkmate' };
    else if (this.chess.isStalemate()) this.result = { winner: null, reason: 'stalemate' };
    else if (this.chess.isInsufficientMaterial()) this.result = { winner: null, reason: 'insufficient material' };
    else if (this.chess.isThreefoldRepetition()) this.result = { winner: null, reason: 'threefold repetition' };
    else if (this.chess.isDraw()) this.result = { winner: null, reason: 'fifty-move rule' };

    const kind = mate ? 'mate' : check ? 'check' : m.captured ? 'capture' : null;
    const square = check ? this.pieces.find((p) => p.type === 'k' && p.color === opponent)?.square : m.to;
    this.burst = kind ? { id: nextBurstId++, kind, square } : null;

    if (this.result) this.#sound('end');
    else if (check) this.#sound('check');
    else if (m.promotion) this.#sound('promote');
    else if (m.captured) this.#sound('capture');
    else if (m.flags.includes('k') || m.flags.includes('q')) this.#sound('castle');
    else this.#sound('move');

    this.#save();
    this.#maybeAI();
  }

  undo() {
    if (this.thinking || !this.moves.length) return;
    const withEngine = this.mode === 'ai' && this.turn === this.human;
    if (withEngine && this.moves.length <= (this.human === 'b' ? 1 : 0)) return;
    const count = withEngine ? 2 : 1;
    for (let i = 0; i < count && this.moves.length; i++) {
      this.chess.undo();
      this.moves.pop();
    }
    this.#job++;
    this.cursor = null;
    this.result = null;
    this.burst = null;
    this.#last = Date.now();
    this.#sync();
    this.#save();
    this.#maybeAI();
  }

  jump(n) {
    this.cursor = n >= this.moves.length ? null : Math.max(0, n);
    this.burst = null;
    this.#sync();
  }

  step(delta) {
    this.jump(this.viewIndex + delta);
  }

  resign() {
    if (this.result) return;
    const loser = this.mode === 'ai' ? this.human : this.turn;
    this.#finish({ winner: loser === 'w' ? 'b' : 'w', reason: 'resignation' });
  }

  flip() {
    this.orientation = this.orientation === 'w' ? 'b' : 'w';
  }

  tick() {
    const now = Date.now();
    const dt = now - this.#last;
    this.#last = now;
    if (this.clockCfg.base === 0 || this.result || this.moves.length < 2) return;
    const side = this.turn;
    this.times[side] = Math.max(0, this.times[side] - dt);
    if (this.times[side] === 0) this.#finish({ winner: side === 'w' ? 'b' : 'w', reason: 'time' });
  }

  setTheme(theme) {
    this.theme = theme;
    this.#prefs();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.#prefs();
  }

  pgn() {
    const c = new Chess();
    for (const m of this.moves) c.move(m.san);
    const name = (color) =>
      this.mode === 'ai' ? (color === this.human ? 'You' : `Engine ${this.elo}`) : color === 'w' ? 'White' : 'Black';
    c.setHeader('White', name('w'));
    c.setHeader('Black', name('b'));
    if (this.mode === 'ai') c.setHeader(this.human === 'w' ? 'BlackElo' : 'WhiteElo', String(this.elo));
    c.setHeader('Result', !this.result ? '*' : this.result.winner === 'w' ? '1-0' : this.result.winner === 'b' ? '0-1' : '1/2-1/2');
    return c.pgn();
  }

  fen() {
    return this.chess.fen();
  }

  #finish(result) {
    this.#job++;
    this.thinking = false;
    this.result = result;
    this.#sound('end');
    this.#save();
  }

  #sync() {
    this.pieces = syncPieces(this.pieces, parseFen(this.viewFen));
  }

  #sound(name) {
    if (!this.muted) sfx[name]();
  }

  #save() {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        mode: this.mode,
        human: this.human,
        elo: this.elo,
        clock: this.clock,
        orientation: this.orientation,
        moves: this.moves.map((m) => m.san),
        times: this.times,
        result: this.result
      })
    );
  }

  #prefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ muted: this.muted, theme: this.theme }));
  }

  #maybeAI() {
    if (this.mode !== 'ai' || this.result || this.turn === this.human) return;
    this.thinking = true;
    this.#started = Date.now();
    if (!this.#worker) {
      this.#worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' });
      this.#worker.onmessage = ({ data }) => {
        if (data.job !== this.#job) return;
        const wait = Math.max(0, 450 - (Date.now() - this.#started));
        setTimeout(() => {
          if (data.job !== this.#job) return;
          this.thinking = false;
          this.play(data.move);
        }, wait);
      };
    }
    this.#worker.postMessage({ job: ++this.#job, moves: this.moves.map((m) => m.san), elo: this.elo });
  }
}

export const game = new Game();
