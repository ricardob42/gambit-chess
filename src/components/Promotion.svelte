<script>
  import { fade, fly } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import Piece from './Piece.svelte';

  let { color, onpick, oncancel } = $props();
</script>

<div
  class="promo"
  role="presentation"
  transition:fade={{ duration: 160 }}
  onclick={(e) => {
    if (e.target === e.currentTarget) oncancel();
  }}
>
  <div class="tray" role="dialog" aria-label="Choose a promotion piece">
    {#each ['q', 'n', 'r', 'b'] as type, i}
      <button
        class="choice"
        aria-label="Promote to {type}"
        onclick={() => onpick(type)}
        in:fly={{ y: 30, duration: 420, delay: i * 70, easing: backOut }}
      >
        <Piece {type} {color} />
      </button>
    {/each}
  </div>
</div>

<style>
  .promo {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    backdrop-filter: blur(6px);
    border-radius: 10px;
  }
  .tray {
    display: flex;
    gap: clamp(0.3rem, 2vw, 0.8rem);
    padding: clamp(0.5rem, 2vw, 1rem);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7);
  }
  .choice {
    width: clamp(48px, 15vw, 84px);
    aspect-ratio: 1;
    padding: 6px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--sq-light);
    cursor: pointer;
    transition: transform 0.25s var(--ease-spring), box-shadow 0.25s;
  }
  .choice:nth-child(even) {
    background: var(--sq-dark);
  }
  .choice:hover,
  .choice:focus-visible {
    transform: translateY(-8px) scale(1.08);
    box-shadow: 0 16px 24px -12px var(--accent);
    outline: none;
  }
</style>
