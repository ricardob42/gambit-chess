<script>
  import { game } from '../lib/game.svelte.js';

  let box;

  const rows = $derived(
    Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, i) => ({
      n: i + 1,
      w: game.moves[2 * i],
      b: game.moves[2 * i + 1]
    }))
  );

  $effect(() => {
    game.viewIndex;
    game.moves.length;
    const el = box?.querySelector('.cur');
    if (el) box.scrollTop = Math.max(0, el.offsetTop - box.clientHeight / 2);
  });
</script>

<div class="nav">
  <button onclick={() => game.jump(0)} aria-label="First move" disabled={game.viewIndex === 0}>«</button>
  <button onclick={() => game.step(-1)} aria-label="Previous move" disabled={game.viewIndex === 0}>‹</button>
  <button onclick={() => game.step(1)} aria-label="Next move" disabled={game.live}>›</button>
  <button onclick={() => game.jump(Infinity)} aria-label="Latest move" disabled={game.live}>»</button>
</div>

<div class="list" bind:this={box}>
  {#each rows as row (row.n)}
    <div class="row">
      <span class="num">{row.n}</span>
      <button class="mv" class:cur={game.viewIndex === 2 * row.n - 1} onclick={() => game.jump(2 * row.n - 1)}>
        {row.w.san}
      </button>
      {#if row.b}
        <button class="mv" class:cur={game.viewIndex === 2 * row.n} onclick={() => game.jump(2 * row.n)}>
          {row.b.san}
        </button>
      {/if}
    </div>
  {:else}
    <p class="empty">No moves yet. White opens the game.</p>
  {/each}
</div>

<style>
  .nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }
  .nav button {
    padding: 0.35rem 0;
    font: 600 1.2rem var(--font-mono);
    color: var(--ink);
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
    transition:
      transform 0.2s var(--ease-spring),
      border-color 0.2s;
  }
  .nav button:hover:not(:disabled) {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .nav button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .list {
    position: relative;
    flex: 1;
    min-height: 7rem;
    max-height: 100%;
    overflow-y: auto;
    padding: 0.2rem;
    scrollbar-width: thin;
    scrollbar-color: var(--line) transparent;
  }
  .row {
    display: grid;
    grid-template-columns: 2.2rem 1fr 1fr;
    align-items: center;
    animation: row-in 0.4s var(--ease-out) both;
  }
  .num {
    font: 500 0.8rem var(--font-mono);
    color: var(--ink-dim);
  }
  .mv {
    margin: 1px;
    padding: 0.35rem 0.6rem;
    text-align: left;
    font: 500 0.95rem var(--font-mono);
    color: var(--ink);
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .mv:hover {
    background: var(--panel-2);
  }
  .mv.cur {
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 700;
  }
  .empty {
    margin: 1rem 0.4rem;
    color: var(--ink-dim);
    font: italic 400 1rem var(--font-display);
  }

  @media (max-width: 900px) {
    .list {
      max-height: 12rem;
    }
  }

  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
  }
</style>
