const BASE = '<path d="M26 88h48v-5c0-3-2-5-5-5H31c-3 0-5 2-5 5z"/>';

export const SHAPES = {
  p: `<circle cx="50" cy="30" r="11"/><path d="M42 47h16l3 9c3 8 7 13 7 22H32c0-9 4-14 7-22z"/>${BASE}`,
  r: `<path d="M28 22H38V30H45V22H55V30H62V22H72V44L66 50L69 78H31L34 50L28 44Z"/>${BASE}`,
  n: `<path d="M32 78C32 64 38 56 46 48C40 50 34 52 28 56L22 50C22 42 30 32 38 26L42 14L50 22C66 24 76 38 76 56C76 66 74 72 72 78Z"/><circle cx="44" cy="34" r="2.6" style="fill:var(--edge);stroke:none"/>${BASE}`,
  b: `<circle cx="50" cy="13" r="4.5"/><path d="M50 18c10 8 15 16 13 24-1 5-5 7-7 10H44c-2-3-6-5-7-10-2-8 3-16 13-24z"/><path d="M41 54h18l5 12c1 5 2 9 4 12H32c2-3 3-7 4-12z"/><path d="M50 26v12M44 32h12" style="fill:none"/>${BASE}`,
  q: `<path d="M28 78L20 34L35 52L37 26L44 50L50 18L56 50L63 26L65 52L80 34L72 78Z"/><circle cx="20" cy="30" r="4"/><circle cx="37" cy="22" r="4"/><circle cx="50" cy="14" r="4"/><circle cx="63" cy="22" r="4"/><circle cx="80" cy="30" r="4"/>${BASE}`,
  k: `<path d="M46 6h8v7h7v8h-7v7h-8v-7h-7v-8h7z"/><path d="M50 30c16 0 28 10 24 26-2 8-8 10-10 16l2 6H34l2-6c-2-6-8-8-10-16-4-16 8-26 24-26z"/>${BASE}`
};

export const NAMES = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
