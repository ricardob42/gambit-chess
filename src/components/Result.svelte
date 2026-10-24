<script>
  import { fade, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { game } from '../lib/game.svelte.js';
  import Piece from './Piece.svelte';
  import { t } from '../lib/i18n.svelte.js';

  let { onnew, onreview, oncopy } = $props();
</script>

<div
  class="scrim"
  role="presentation"
  transition:fade={{ duration: 250 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) onreview();
  }}
>
  <div class="sheet result" role="dialog" aria-modal="true" aria-label={t('gameOver')} in:scale={{ start: 0.7, duration: 650, easing: backOut }}>
    <div class="flare"></div>
    {#if game.result.winner}
      <div class="crown"><Piece type="k" color={game.result.winner} /></div>
    {:else}
      <div class="crown split">
        <Piece type="k" color="w" />
        <Piece type="k" color="b" />
      </div>
    {/if}
    <h2>{game.outcome.title}</h2>
    <p>{game.outcome.sub}</p>
    <div class="actions">
      <button class="btn primary" onclick={onnew}>{t('newGame')}</button>
      <button class="btn" onclick={onreview}>{t('reviewBoard')}</button>
      <button class="btn" onclick={oncopy}>{t('copyPgn')}</button>
    </div>
  </div>
</div>

<style>
  .result {
    position: relative;
    overflow: hidden;
    text-align: center;
    padding-top: 2.2rem;
  }
  .flare {
    position: absolute;
    inset: -60%;
    background: conic-gradient(from 0deg, transparent, var(--accent) 8%, transparent 22%, var(--accent) 55%, transparent 70%);
    opacity: 0.16;
    filter: blur(30px);
    animation: spin 9s linear infinite;
    pointer-events: none;
  }
  .crown {
    position: relative;
    width: 5.5rem;
    height: 5.5rem;
    margin: 0 auto 0.4rem;
    padding: 0.5rem;
    border-radius: 50%;
    background: var(--sq-dark);
    box-shadow: 0 0 0 3px var(--accent), 0 0 40px -4px var(--accent);
    animation: float 3s ease-in-out infinite;
  }
  .crown.split {
    display: flex;
    width: 8rem;
    border-radius: 3rem;
  }
  h2 {
    position: relative;
    margin: 0.4rem 0 0;
    font: 700 clamp(2.4rem, 9vw, 3.4rem) var(--font-display);
    letter-spacing: -0.03em;
    background: linear-gradient(100deg, var(--ink) 20%, var(--accent) 50%, var(--ink) 80%);
    background-size: 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 3.5s linear infinite;
  }
  p {
    position: relative;
    margin: 0.2rem 0 1.5rem;
    font: italic 400 1.3rem var(--font-display);
    color: var(--ink-dim);
  }
  .actions {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes float {
    50% {
      transform: translateY(-6px);
    }
  }
  @keyframes shimmer {
    to {
      background-position: -250% 0;
    }
  }
</style>
