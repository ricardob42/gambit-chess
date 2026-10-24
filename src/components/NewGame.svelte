<script>
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { game, BANDS, CLOCKS, bandIndex } from '../lib/game.svelte.js';
  import Piece from './Piece.svelte';

  let { onclose } = $props();

  let mode = $state(game.mode);
  let side = $state(game.mode === 'ai' ? game.human : 'w');
  let elo = $state(game.elo);
  let clock = $state(game.clock);

  const band = $derived(BANDS[bandIndex(elo)]);

  function start() {
    const human = side === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    game.newGame({ mode, human, elo, clock });
    onclose();
  }
</script>

<div
  class="scrim"
  role="presentation"
  transition:fade={{ duration: 200 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) onclose();
  }}
>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="New game" in:fly={{ y: 50, duration: 450, easing: cubicOut }} out:fly={{ y: 30, duration: 200 }}>
    <h2>New game</h2>

    <div class="group">
      <h3>Opponent</h3>
      <div class="seg">
        <button aria-pressed={mode === 'ai'} onclick={() => (mode = 'ai')}>The engine</button>
        <button aria-pressed={mode === 'local'} onclick={() => (mode = 'local')}>A friend</button>
      </div>
    </div>

    {#if mode === 'ai'}
      <div class="group" transition:fade={{ duration: 150 }}>
        <h3>You play</h3>
        <div class="seg sides">
          <button aria-pressed={side === 'w'} onclick={() => (side = 'w')}>
            <span class="glyph"><Piece type="k" color="w" /></span>White
          </button>
          <button aria-pressed={side === 'r'} onclick={() => (side = 'r')}>
            <span class="glyph q">?</span>Random
          </button>
          <button aria-pressed={side === 'b'} onclick={() => (side = 'b')}>
            <span class="glyph"><Piece type="k" color="b" /></span>Black
          </button>
        </div>
      </div>

      <div class="group" transition:fade={{ duration: 150 }}>
        <h3>Strength</h3>
        <div class="readout">
          <strong>{elo}</strong>
          <span>{band.name}</span>
        </div>
        <input type="range" min="0" max="2400" step="50" bind:value={elo} style="--p:{elo / 24}%" aria-label="Engine Elo rating" />
        <div class="legend">
          {#each BANDS as b, i}
            <button class="chip band" aria-pressed={i === bandIndex(elo)} onclick={() => (elo = b.from + 200)}>
              <span>{b.name}</span>
              <small>{b.from}–{b.to}</small>
            </button>
          {/each}
        </div>
        <p class="note">Ratings are approximate. The engine runs in your browser, so the top rating means its maximum search depth and thinking time, not true engine-level play.</p>
      </div>
    {/if}

    <div class="group">
      <h3>Clock</h3>
      <div class="chips">
        {#each CLOCKS as c}
          <button class="chip" aria-pressed={clock === c.id} onclick={() => (clock = c.id)}>{c.label}</button>
        {/each}
      </div>
    </div>

    <div class="actions">
      <button class="btn" onclick={onclose}>Cancel</button>
      <button class="btn primary" onclick={start}>Start game</button>
    </div>
  </div>
</div>

<style>
  h2 {
    margin: 0 0 1rem;
    font: 700 2rem var(--font-display);
    letter-spacing: -0.02em;
  }
  h3 {
    margin: 0 0 0.45rem;
    font: 500 0.9rem var(--font-mono);
    color: var(--ink-dim);
  }
  .group {
    margin-bottom: 1.1rem;
  }
  .seg {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 0.4rem;
    padding: 0.3rem;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 14px;
  }
  .seg button,
  .chip {
    font: 600 0.95rem var(--font-display);
    color: var(--ink);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 0.6rem 0.5rem;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      transform 0.25s var(--ease-spring);
  }
  .seg button:hover,
  .chip:hover {
    transform: translateY(-2px);
  }
  [aria-pressed='true'] {
    background: var(--accent) !important;
    color: var(--accent-ink) !important;
  }
  .sides button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
  }
  .glyph {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--sq-dark);
    padding: 2px;
    display: grid;
    place-items: center;
  }
  .glyph.q {
    font: 700 1rem var(--font-display);
    color: var(--ink);
  }
  .readout {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
  }
  .readout strong {
    font: 800 3rem/1 var(--font-display);
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }
  .readout span {
    font: italic 400 1.4rem var(--font-display);
    color: var(--accent);
  }
  input[type='range'] {
    appearance: none;
    width: 100%;
    height: 10px;
    margin: 0.8rem 0 1rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent) var(--p), var(--bg) var(--p));
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--ink);
    border: 4px solid var(--accent);
    transition: transform 0.2s var(--ease-spring);
  }
  input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ink);
    border: 4px solid var(--accent);
    transition: transform 0.2s var(--ease-spring);
  }
  input[type='range']:active::-webkit-slider-thumb {
    transform: scale(1.25);
  }
  input[type='range']:active::-moz-range-thumb {
    transform: scale(1.25);
  }
  .legend {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }
  .band {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    font-family: var(--font-display);
    border-radius: 12px;
    text-align: left;
  }
  .band small {
    font: 500 0.75rem var(--font-mono);
    opacity: 0.8;
  }
  .note {
    margin: 0.7rem 0 0;
    font: 400 0.8rem/1.4 var(--font-mono);
    color: var(--ink-dim);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
  .chip {
    background: var(--panel-2);
    border-color: var(--line);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 1.4rem;
  }
</style>
