<script>
  import { CATEGORIES, CATEGORY_COLORS } from "$lib/types";
  import { activeFilters } from "$lib/stores/milestones";

  let filters = $state([]);
  activeFilters.subscribe((v) => (filters = v));

  function toggleFilter(category) {
    activeFilters.update((f) => {
      if (f.includes(category)) return f.filter((c) => c !== category);
      return [...f, category];
    });
  }

  function clearFilters() {
    activeFilters.set([]);
  }
</script>

<div class="filters">
  <span class="filter-label">Filter:</span>
  {#each CATEGORIES as cat}
    <button
      class="filter-chip"
      class:active={filters.includes(cat)}
      style="--chip-color: {CATEGORY_COLORS[cat]}"
      onclick={() => toggleFilter(cat)}
    >
      {cat}
    </button>
  {/each}
  {#if filters.length > 0}
    <button class="clear-btn" onclick={clearFilters}>Clear all</button>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .filter-chip {
    padding: 0.35rem 0.85rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .filter-chip:hover {
    border-color: var(--chip-color);
    color: var(--chip-color);
  }

  .filter-chip.active {
    background: var(--chip-color);
    border-color: var(--chip-color);
    color: white;
  }

  .clear-btn {
    padding: 0.35rem 0.75rem;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    text-decoration: underline;
  }

  .clear-btn:hover {
    color: var(--text-primary);
  }
</style>
