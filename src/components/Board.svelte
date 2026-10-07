<script>
  import { scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { game } from '../lib/game.svelte.js';
  import Piece from './Piece.svelte';
  import Promotion from './Promotion.svelte';

  const FILES = 'abcdefgh';

  let boardEl;
  let selected = $state(null);
  let targets = $state([]);
  let drag = $state(null);
  let pending = $state(null);
  let moved = false;
  let wasSelected = false;
  let origin = { x: 0, y: 0 };

  const flipped = $derived(game.orientation === 'b');
  const hints = $derived(new Map(targets.map((m) => [m.to, m])));

  const cells = $derived(
    Array.from({ length: 64 }, (_, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const file = flipped ? 7 - col : col;
      const rank = flipped ? row : 7 - row;
      return {
        i,
        sq: FILES[file] + (rank + 1),
        dark: (file + rank) % 2 === 0,
        fileLabel: row === 7 ? FILES[file] : '',
        rankLabel: col === 0 ? rank + 1 : ''
      };
    })
  );

  function place(sq) {
    const file = FILES.indexOf(sq[0]);
    const rank = Number(sq[1]) - 1;
    return { col: flipped ? 7 - file : file, row: flipped ? rank : 7 - rank };
  }

  function cellStyle(sq) {
    const { col, row } = place(sq);
    return `transform:translate(${col * 100}%,${row * 100}%)`;
  }

  function pieceStyle(p) {
    return drag?.id === p.id ? `transform:translate(${drag.x}px,${drag.y}px)` : cellStyle(p.square);
  }

  function squareAt(e) {
    const r = boardEl.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * 8);
    const row = Math.floor(((e.clientY - r.top) / r.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const file = flipped ? 7 - col : col;
    const rank = flipped ? row : 7 - row;
    return FILES[file] + (rank + 1);
  }

  function offset(e) {
    const r = boardEl.getBoundingClientRect();
    const cell = r.width / 8;
    return { x: e.clientX - r.left - cell / 2, y: e.clientY - r.top - cell / 2 };
  }

  function clear() {
    selected = null;
    targets = [];
  }

  function attempt(from, to) {
    const options = targets.filter((m) => m.from === from && m.to === to);
    if (options.some((m) => m.promotion)) {
      pending = { from, to };
      drag = null;
      return;
    }
    game.play({ from, to });
  }

  function promote(type) {
    const { from, to } = pending;
    pending = null;
    game.play({ from, to, promotion: type });
  }

  function down(e) {
    if (pending || e.button > 0) return;
    const sq = squareAt(e);
    if (!sq) return;
    if (selected && targets.some((m) => m.to === sq)) return attempt(selected, sq);
    const piece = game.pieces.find((p) => p.square === sq);
    if (piece && game.canMove && piece.color === game.turn) {
      wasSelected = selected === sq;
      selected = sq;
      targets = game.legalMoves(sq);
      drag = { id: piece.id, from: sq, ...offset(e) };
      origin = { x: e.clientX, y: e.clientY };
      moved = false;
      boardEl.setPointerCapture(e.pointerId);
    } else clear();
  }

  function move(e) {
    if (!drag) return;
    drag = { ...drag, ...offset(e) };
    if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 6) moved = true;
  }

  function up(e) {
    if (!drag) return;
    const from = drag.from;
    drag = null;
    if (!moved) {
      if (wasSelected) clear();
      return;
    }
    const to = squareAt(e);
    if (to && to !== from && targets.some((m) => m.to === to)) attempt(from, to);
  }

  $effect(() => {
    game.moves.length;
    game.cursor;
    game.result;
    selected = null;
    targets = [];
    pending = null;
  });
</script>

<div class="wrap">
  <div
    class="board"
    class:shake={game.live && game.burst?.kind === 'mate'}
    bind:this={boardEl}
    role="application"
    aria-label="Chess board"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={() => (drag = null)}
  >
    {#each cells as c (c.sq)}
      {@const hint = hints.get(c.sq)}
      <div
        class="sq"
        class:dark={c.dark}
        class:last={game.viewMove && (game.viewMove.from === c.sq || game.viewMove.to === c.sq)}
        class:sel={selected === c.sq}
        class:check={game.checkSquare === c.sq}
        style="--i:{c.i}"
      >
        {#if c.rankLabel}<span class="coord rank">{c.rankLabel}</span>{/if}
        {#if c.fileLabel}<span class="coord file">{c.fileLabel}</span>{/if}
        {#if hint}<span class="hint" class:cap={hint.captured || hint.flags.includes('e')}></span>{/if}
      </div>
    {/each}

    {#each game.pieces as p (p.id)}
      <div
        class="pc"
        class:drag={drag?.id === p.id}
        class:lift={selected === p.square && !drag}
        class:top={game.viewMove?.to === p.square}
        style={pieceStyle(p)}
      >
        <div
          class="inner"
          in:scale={{ start: 0.2, duration: 520, delay: p.id <= 32 ? p.id * 14 : 0, easing: backOut }}
          out:scale={{ start: 0.1, duration: 280 }}
        >
          <Piece type={p.type} color={p.color} />
        </div>
      </div>
    {/each}

    {#if game.burst && game.live}
      {#key game.burst.id}
        <div class="burst {game.burst.kind}" style={cellStyle(game.burst.square)}></div>
      {/key}
    {/if}
  </div>

  {#if pending}
    <Promotion color={game.turn} onpick={promote} oncancel={() => (pending = null)} />
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }
  .board {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    border-radius: 10px;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 40px 80px -30px rgba(0, 0, 0, 0.8),
      0 0 90px -30px var(--accent);
    animation: board-in 0.9s var(--ease-out) both;
  }
  .board.shake {
    animation: shake 0.6s ease-in-out;
  }

  .sq {
    position: relative;
    background: var(--sq-light);
    animation: sq-in 0.6s var(--ease-out) both;
    animation-delay: calc(var(--i) * 8ms + 80ms);
  }
  .sq.dark {
    background: var(--sq-dark);
  }
  .sq.last::before,
  .sq.sel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--hl-last);
  }
  .sq.sel::before {
    background: var(--hl-sel);
  }
  .sq.check::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, var(--danger) 0%, transparent 72%);
    animation: pulse 1.1s ease-in-out infinite;
  }

  .coord {
    position: absolute;
    font: 600 clamp(0.5rem, 1.8vw, 0.7rem) var(--font-mono);
    color: var(--sq-dark);
    pointer-events: none;
    z-index: 1;
  }
  .dark .coord {
    color: var(--sq-light);
  }
  .rank {
    top: 4%;
    left: 6%;
  }
  .file {
    bottom: 2%;
    right: 6%;
  }

  .hint {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 1;
  }
  .hint::before {
    content: '';
    width: 30%;
    height: 30%;
    border-radius: 50%;
    background: var(--hint);
    animation: hint-in 0.3s var(--ease-spring) both;
  }
  .hint.cap::before {
    width: 90%;
    height: 90%;
    background: transparent;
    border: 5px solid var(--hint);
  }

  .pc {
    position: absolute;
    left: 0;
    top: 0;
    width: 12.5%;
    height: 12.5%;
    z-index: 2;
    pointer-events: none;
    transition: transform 0.38s var(--ease-spring);
  }
  .pc.top {
    z-index: 3;
  }
  .pc.drag {
    z-index: 6;
    transition: none;
  }
  .inner {
    width: 100%;
    height: 100%;
    padding: 5%;
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.45));
    transition:
      transform 0.25s var(--ease-spring),
      filter 0.25s;
  }
  .lift .inner {
    transform: translateY(-7%) scale(1.06);
  }
  .drag .inner {
    transform: scale(1.22);
    filter: drop-shadow(0 16px 10px rgba(0, 0, 0, 0.5));
  }

  .burst {
    position: absolute;
    left: 0;
    top: 0;
    width: 12.5%;
    height: 12.5%;
    z-index: 4;
    pointer-events: none;
    --c: var(--accent);
  }
  .burst.check,
  .burst.mate {
    --c: var(--danger);
  }
  .burst::before,
  .burst::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid var(--c);
    opacity: 0;
    animation: ring 0.7s var(--ease-out) forwards;
  }
  .burst::after {
    border-width: 2px;
    animation-delay: 0.12s;
  }
  .burst.mate::before,
  .burst.mate::after {
    animation-duration: 1.2s;
    border-width: 6px;
  }

  @keyframes board-in {
    from {
      opacity: 0;
      transform: perspective(900px) rotateX(16deg) translateY(30px) scale(0.94);
    }
  }
  @keyframes sq-in {
    from {
      opacity: 0;
      transform: scale(0.5) rotate(-8deg);
    }
  }
  @keyframes hint-in {
    from {
      transform: scale(0);
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.45;
    }
  }
  @keyframes ring {
    0% {
      transform: scale(0.4);
      opacity: 1;
    }
    100% {
      transform: scale(2.8);
      opacity: 0;
    }
  }
  @keyframes shake {
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(5px); }
    30%, 50%, 70% { transform: translateX(-8px); }
    40%, 60% { transform: translateX(8px); }
  }
</style>
