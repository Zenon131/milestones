<script>
  import { theme } from "$lib/stores/milestones";

  function toggle() {
    theme.toggle();
  }

  let currentTheme = $state("light");
  theme.subscribe((v) => (currentTheme = v));
</script>

<button class="theme-toggle" onclick={toggle} aria-label="Toggle theme">
  {#if currentTheme === "light"}
    <span class="icon">🌙</span>
  {:else}
    <span class="icon">☀️</span>
  {/if}
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    background: var(--bg-card);
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    background: var(--bg-hover);
    transform: scale(1.05);
  }

  .icon {
    font-size: 1.15rem;
    line-height: 1;
  }
</style>
