import { Chess } from 'chess.js';

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

const PST = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
};
const KING_END = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

// Maps an Elo setting (0 to 2400) to search depth, think time, evaluation noise and the chance of a random slip.
function config(elo) {
  const e = Math.min(2400, Math.max(0, elo));
  return {
    depth: e < 600 ? 1 : e < 1200 ? 2 : e < 1700 ? 3 : e < 2100 ? 4 : 5,
    time: Math.round(500 + e * 0.9),
    noise: Math.max(0, Math.round(400 * (1 - e / 1800))),
    slip: e < 600 ? 0.5 * (1 - e / 600) : 0
  };
}

let deadline = 0;
let aborted = false;

function evaluate(chess) {
  const pieces = [];
  let material = 0;
  chess.board().forEach((rank, r) =>
    rank.forEach((p, c) => {
      if (!p) return;
      pieces.push({ ...p, r, c });
      if (p.type !== 'p' && p.type !== 'k') material += VALUE[p.type];
    })
  );
  const endgame = material < 2400;
  let score = 0;
  for (const p of pieces) {
    const idx = p.color === 'w' ? p.r * 8 + p.c : (7 - p.r) * 8 + p.c;
    const table = p.type === 'k' && endgame ? KING_END : PST[p.type];
    const v = VALUE[p.type] + table[idx];
    score += p.color === 'w' ? v : -v;
  }
  return chess.turn() === 'w' ? score : -score;
}

const rank = (m) => (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] : 0) + (m.promotion ? VALUE[m.promotion] : 0);
const ordered = (moves) => moves.sort((a, b) => rank(b) - rank(a));
const make = (chess, m) => chess.move({ from: m.from, to: m.to, promotion: m.promotion });

function quiesce(chess, alpha, beta, depth) {
  const stand = evaluate(chess);
  if (depth >= 4 || stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  for (const m of ordered(chess.moves({ verbose: true }).filter((x) => x.captured))) {
    make(chess, m);
    const s = -quiesce(chess, -beta, -alpha, depth + 1);
    chess.undo();
    if (s >= beta) return s;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

function negamax(chess, depth, alpha, beta, ply) {
  if (aborted || Date.now() > deadline) {
    aborted = true;
    return 0;
  }
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return chess.isCheck() ? -MATE + ply : 0;
  if (depth === 0) return quiesce(chess, alpha, beta, 0);
  let best = -Infinity;
  for (const m of ordered(moves)) {
    make(chess, m);
    const s = -negamax(chess, depth - 1, -beta, -alpha, ply + 1);
    chess.undo();
    if (aborted) return 0;
    if (s > best) best = s;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function pick(chess, cfg) {
  deadline = Date.now() + cfg.time;
  if (Math.random() < cfg.slip) {
    const all = chess.moves({ verbose: true });
    const m = all[Math.floor(Math.random() * all.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }
  let root = ordered(chess.moves({ verbose: true }));
  let best = root[0];
  for (let depth = 1; depth <= cfg.depth; depth++) {
    aborted = false;
    let alpha = -Infinity;
    let iterBest = null;
    let iterScore = -Infinity;
    for (const m of root) {
      make(chess, m);
      const s = chess.isThreefoldRepetition() ? 0 : -negamax(chess, depth - 1, -Infinity, cfg.noise ? Infinity : -alpha, 1);
      chess.undo();
      if (aborted) break;
      const scored = s + Math.random() * cfg.noise;
      if (scored > iterScore) {
        iterScore = scored;
        iterBest = m;
      }
      if (!cfg.noise && s > alpha) alpha = s;
    }
    if (aborted) break;
    best = iterBest;
    root = [iterBest, ...root.filter((m) => m !== iterBest)];
    if (Math.abs(iterScore) > MATE - 100) break;
  }
  return { from: best.from, to: best.to, promotion: best.promotion };
}

self.onmessage = ({ data: { job, moves, elo } }) => {
  const chess = new Chess();
  for (const san of moves) chess.move(san);
  self.postMessage({ job, move: pick(chess, config(elo)) });
};
