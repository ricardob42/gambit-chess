<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { game, THEMES } from './lib/game.svelte.js';
  import Board from './components/Board.svelte';
  import PlayerBar from './components/PlayerBar.svelte';
  import MoveList from './components/MoveList.svelte';
  import NewGame from './components/NewGame.svelte';
  import Result from './components/Result.svelte';
  import Piece from './components/Piece.svelte';

  let menu = $state(false);
  let resultOpen = $state(false);
  let installEvent = $state(null);
  let toast = $state('');
  let toastTimer;
  let seen = game.result;

  const status = $derived.by(() => {
    if (game.result) return `${game.outcome.title}. ${game.outcome.sub}.`;
    if (!game.live) return `Reviewing move ${Math.ceil(game.viewIndex / 2)}. Press End to return.`;
    if (game.thinking) return 'The engine is thinking';
    if (game.checkSquare) return `${game.turn === 'w' ? 'White' : 'Black'} is in check`;
    return `${game.turn === 'w' ? 'White' : 'Black'} to move`;
  });

  $effect(() => {
    const id = setInterval(() => game.tick(), 100);
    return () => clearInterval(id);
  });

  $effect(() => {
    document.documentElement.dataset.theme = game.theme;
  });

  $effect(() => {
    const r = game.result;
    if (!r) {
      seen = null;
      resultOpen = false;
    } else if (r !== seen) {
      seen = r;
      const t = setTimeout(() => (resultOpen = true), 1000);
      return () => clearTimeout(t);
    }
  });

  onMount(() => game.resume());

  function cycleTheme() {
    game.setTheme(THEMES[(THEMES.indexOf(game.theme) + 1) % THEMES.length]);
  }

  async function copy(text, message) {
    await navigator.clipboard.writeText(text);
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 1800);
  }

  async function install() {
    await installEvent.prompt();
    installEvent = null;
  }

  function onkey(e) {
    if (menu || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') resultOpen = false;
    else if (e.key === 'ArrowLeft') game.step(-1);
    else if (e.key === 'ArrowRight') game.step(1);
    else if (e.key === 'Home') game.jump(0);
    else if (e.key === 'End') game.jump(Infinity);
    else if (e.key === 'f') game.flip();
  }
</script>

<svelte:window
  onkeydown={onkey}
  onbeforeinstallprompt={(e) => {
    e.preventDefault();
    installEvent = e;
  }}
  onappinstalled={() => (installEvent = null)}
/>

<main class="app">
  <section class="stage">
    <PlayerBar color={game.orientation === 'w' ? 'b' : 'w'} />
    <Board />
    <PlayerBar color={game.orientation} />
  </section>

  <aside class="panel" in:fly={{ x: 60, duration: 800, delay: 300, easing: cubicOut }}>
    <header class="brand">
      <span class="logo"><Piece type="n" color="w" /></span>
      <h1>Gambit</h1>
    </header>

    <p class="status" aria-live="polite">{status}</p>

    <MoveList />

    <div class="tools">
      <button class="btn primary" onclick={() => (menu = true)}>New game</button>
      <button class="btn" onclick={() => game.undo()} disabled={game.thinking || !game.moves.length}>Undo</button>
      <button class="btn" onclick={() => game.flip()}>Flip</button>
      <button class="btn danger" onclick={() => game.resign()} disabled={!!game.result || !game.moves.length}>Resign</button>
      <button class="btn" onclick={() => copy(game.pgn(), 'PGN copied')} disabled={!game.moves.length}>PGN</button>
      <button class="btn" onclick={() => copy(game.fen(), 'FEN copied')}>FEN</button>
      <button class="btn" onclick={() => game.toggleMute()} aria-pressed={!game.muted}>Sound {game.muted ? 'off' : 'on'}</button>
      <button class="btn" onclick={cycleTheme}>Theme: {game.theme}</button>
      {#if installEvent}
        <button class="btn primary" onclick={install}>Install app</button>
      {/if}
    </div>
  </aside>
</main>

{#if menu}
  <NewGame onclose={() => (menu = false)} />
{/if}

{#if resultOpen && game.result}
  <Result
    onnew={() => {
      resultOpen = false;
      menu = true;
    }}
    onreview={() => (resultOpen = false)}
    oncopy={() => copy(game.pgn(), 'PGN copied')}
  />
{/if}

{#if toast}
  <div class="toast" role="status" transition:fly={{ y: 20, duration: 250 }}>{toast}</div>
{/if}
