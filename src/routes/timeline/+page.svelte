<script>
  import {
    filteredMilestones,
    selectedMilestone,
  } from "$lib/stores/milestones";
  import { getImage } from "$lib/stores/imageStore";
  import { CATEGORY_COLORS, CATEGORY_ICONS } from "$lib/types";
  import CategoryFilter from "$lib/components/CategoryFilter.svelte";

  let items = $state([]);
  filteredMilestones.subscribe((v) => (items = v));

  // Resolved image cache: imageId -> data URL
  let imageCache = $state({});

  $effect(() => {
    for (const m of items) {
      if (m.imageId && !imageCache[m.imageId]) {
        getImage(m.imageId).then((img) => {
          if (img) {
            imageCache = { ...imageCache, [m.imageId]: img.data };
          }
        });
      }
    }
  });

  function getThumbSrc(m) {
    if (m.imageId && imageCache[m.imageId]) return imageCache[m.imageId];
    if (m.imageUrl) return m.imageUrl;
    return "";
  }

  // Zoom state
  let zoomLevel = $state(1);

  function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.25, 2);
  }
  function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
  }
  function resetZoom() {
    zoomLevel = 1;
  }

  function selectMilestone(m) {
    selectedMilestone.set(m);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function groupByYear(milestones) {
    const groups = {};
    for (const m of milestones) {
      const year = new Date(m.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }
</script>

<div class="page">
  <div class="header">
    <div class="title-row">
      <h1>📅 Timeline</h1>
      <div class="zoom-controls">
        <button onclick={zoomOut} title="Zoom out">−</button>
        <span class="zoom-label">{Math.round(zoomLevel * 100)}%</span>
        <button onclick={zoomIn} title="Zoom in">+</button>
        <button onclick={resetZoom} title="Reset" class="reset-btn">↺</button>
      </div>
    </div>
    <CategoryFilter />
  </div>

  {#if items.length === 0}
    <div class="empty">
      <p>No milestones to display. <a href="/add-milestone">Add one</a>!</p>
    </div>
  {:else}
    <div class="timeline-container" style="--zoom: {zoomLevel}">
      {#each groupByYear(items) as [year, yearMilestones]}
        <div class="year-group">
          <div class="year-label">{year}</div>
          <div class="year-items">
            {#each yearMilestones as m, i}
              <button
                class="timeline-item"
                class:right={i % 2 === 1}
                onclick={() => selectMilestone(m)}
              >
                <div
                  class="dot"
                  style="background: {CATEGORY_COLORS[m.category]}"
                ></div>
                <div class="card">
                  {#if getThumbSrc(m)}
                    <div class="card-thumb">
                      <img src={getThumbSrc(m)} alt={m.title} />
                    </div>
                  {/if}
                  <div class="card-top">
                    <span class="card-icon">{CATEGORY_ICONS[m.category]}</span>
                    <span class="card-date">{formatDate(m.date)}</span>
                  </div>
                  <h3>{m.title}</h3>
                  {#if m.location}
                    <span class="card-location">📍 {m.location}</span>
                  {/if}
                  <p class="card-desc">
                    {m.description.length > 120
                      ? m.description.slice(0, 120) + "…"
                      : m.description}
                  </p>
                  <span
                    class="card-badge"
                    style="background: {CATEGORY_COLORS[
                      m.category
                    ]}20; color: {CATEGORY_COLORS[m.category]}"
                    >{m.category}</span
                  >
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 800;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    padding: 0.2rem;
  }

  .zoom-controls button {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: var(--radius-full);
    font-size: 1rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .zoom-controls button:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .zoom-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    min-width: 36px;
    text-align: center;
  }

  .empty {
    text-align: center;
    padding: 4rem 1rem;
    background: var(--bg-card);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
  }

  .timeline-container {
    position: relative;
    padding-left: 40px;
    transform-origin: top left;
    transform: scale(var(--zoom));
  }

  .timeline-container::before {
    content: "";
    position: absolute;
    left: 18px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--timeline-line);
    border-radius: 2px;
  }

  .year-group {
    margin-bottom: 2rem;
  }

  .year-label {
    position: relative;
    left: -40px;
    display: inline-flex;
    padding: 0.4rem 1.2rem;
    background: var(--accent);
    color: white;
    border-radius: var(--radius-full);
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
    z-index: 2;
  }

  .year-items {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .timeline-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background: none;
    border: none;
    text-align: left;
    padding: 0;
    width: 100%;
    cursor: pointer;
  }

  .dot {
    position: absolute;
    left: -31px;
    top: 1.1rem;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 3px solid var(--bg-primary);
    box-shadow: 0 0 0 2px var(--timeline-line);
    z-index: 2;
    flex-shrink: 0;
  }

  .card {
    flex: 1;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 0;
    transition: all 0.2s ease;
    max-width: 560px;
    overflow: hidden;
  }

  .card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
  }

  .card-thumb {
    width: 100%;
    height: 140px;
    overflow: hidden;
  }

  .card-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
    padding: 1.1rem 1.25rem 0;
  }

  .card-icon {
    font-size: 1.1rem;
  }

  .card-date {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
    color: var(--text-primary);
    padding: 0 1.25rem;
  }

  .card-location {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    padding: 0 1.25rem;
  }

  .card-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 0.6rem;
    padding: 0 1.25rem;
  }

  .card-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-full);
    font-size: 0.72rem;
    font-weight: 600;
    margin: 0 1.25rem 1.1rem;
  }

  @media (max-width: 600px) {
    h1 {
      font-size: 1.35rem;
    }

    .timeline-container {
      padding-left: 30px;
    }

    .timeline-container::before {
      left: 12px;
    }

    .dot {
      left: -25px;
      width: 12px;
      height: 12px;
    }

    .year-label {
      left: -30px;
      font-size: 0.8rem;
    }
  }
</style>
