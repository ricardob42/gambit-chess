<script>
  import { SHAPES, NAMES } from '../lib/pieces.js';

  let { type, color } = $props();
</script>

<svg viewBox="0 0 100 100" class={color} role="img" aria-label="{color === 'w' ? 'white' : 'black'} {NAMES[type]}">
  <g class="shape" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    {@html SHAPES[type]}
  </g>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .w {
    --fill: var(--pw-fill);
    --edge: var(--pw-edge);
  }
  .b {
    --fill: var(--pb-fill);
    --edge: var(--pb-edge);
  }
  .shape {
    fill: var(--fill);
    stroke: var(--edge);
  }
</style>
