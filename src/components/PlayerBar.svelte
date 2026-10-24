<script>
  import { game } from '../lib/game.svelte.js';
  import Piece from './Piece.svelte';
  import { t } from '../lib/i18n.svelte.js';

  let { color } = $props();

  const opponent = $derived(color === 'w' ? 'b' : 'w');
  const name = $derived(
    game.mode === 'ai'
      ? color === game.human
        ? t('you')
        : `${t('engine')} ${game.elo}`
      : t(color === 'w' ? 'nameW' : 'nameB')
  );
  const lead = $derived(color === 'w' ? game.balance : -game.balance);
  const timed = $derived(game.clockCfg.base > 0);
  const active = $derived(!game.result && game.turn === color);
  const ms = $derived(game.times[color]);
  const low = $derived(timed && ms < 20000);
  const engineThinking = $derived(game.thinking && game.mode === 'ai' && color !== game.human);

  function format(ms) {
    if (ms < 10000) return (ms / 1000).toFixed(1);
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
</script>

<div class="bar" class:active>
  <div class="who">
    <span class="avatar"><Piece type="k" {color} /></span>
    <span class="name">{name}</span>
    {#if engineThinking}<span class="dots" aria-label={t('thinkingAria')}><i></i><i></i><i></i></span>{/if}
  </div>

  <div class="grabbed" aria-label={t('capturedAria')}>
    {#each game.captured[color] as type}
      <span class="mini"><Piece {type} color={opponent} /></span>
    {/each}
    {#if lead > 0}<span class="lead">+{lead}</span>{/if}
  </div>

  {#if timed}
    <div class="clock" class:low class:ticking={active}>{format(ms)}</div>
  {/if}
</div>

<style>
  .bar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    min-height: 3.2rem;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
    transition:
      border-color 0.3s,
      box-shadow 0.4s,
      transform 0.4s var(--ease-spring);
  }
  .bar.active {
    border-color: var(--accent);
    box-shadow: 0 10px 30px -14px var(--accent);
    transform: translateY(-1px);
  }
  .who {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }
  .avatar {
    width: 2rem;
    height: 2rem;
    padding: 3px;
    border-radius: 50%;
    background: var(--sq-dark);
    flex: none;
  }
  .name {
    font: 600 1.05rem var(--font-display);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dots {
    display: inline-flex;
    gap: 3px;
  }
  .dots i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    animation: bounce 0.9s ease-in-out infinite;
  }
  .dots i:nth-child(2) {
    animation-delay: 0.15s;
  }
  .dots i:nth-child(3) {
    animation-delay: 0.3s;
  }
  .grabbed {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    padding-left: 0.4rem;
  }
  .mini {
    width: 1.35rem;
    height: 1.35rem;
    margin-right: -0.55rem;
    flex: none;
    animation: drop-in 0.45s var(--ease-spring) both;
  }
  .lead {
    margin-left: 0.9rem;
    font: 600 0.8rem var(--font-mono);
    color: var(--ink-dim);
  }
  .clock {
    min-width: 4.6rem;
    padding: 0.3rem 0.7rem;
    border-radius: 10px;
    text-align: right;
    font: 600 1.35rem var(--font-mono);
    font-variant-numeric: tabular-nums;
    background: var(--panel-2);
    color: var(--ink-dim);
    transition:
      background 0.3s,
      color 0.3s;
  }
  .clock.ticking {
    background: var(--ink);
    color: var(--bg);
  }
  .clock.low.ticking {
    background: var(--danger);
    color: #fff;
    animation: urgent 1s ease-in-out infinite;
  }

  @keyframes bounce {
    50% {
      transform: translateY(-4px);
      opacity: 0.5;
    }
  }
  @keyframes drop-in {
    from {
      transform: translateY(-14px) scale(0.4);
      opacity: 0;
    }
  }
  @keyframes urgent {
    50% {
      transform: scale(1.06);
    }
  }
</style>
