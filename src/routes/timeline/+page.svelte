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
    <div class="timeline" style="--zoom: {zoomLevel}">
      {#each groupByYear(items) as [year, yearMilestones], yi}
        <div class="year-row" class:first={yi === 0}>
          <div class="track-col year-track">
            <div class="year-dot"></div>
          </div>
          <div class="year-badge">{year}</div>
        </div>

        {#each yearMilestones as m}
          <button class="entry" onclick={() => selectMilestone(m)}>
            <div class="track-col">
              <div
                class="dot"
                style="--dot-color: {CATEGORY_COLORS[m.category]}"
              ></div>
            </div>
            <div class="card">
              {#if getThumbSrc(m)}
                <div class="card-thumb">
                  <img src={getThumbSrc(m)} alt={m.title} loading="lazy" />
                </div>
              {/if}
              <div class="card-body">
                <div class="card-meta">
                  <span class="card-icon">{CATEGORY_ICONS[m.category]}</span>
                  <time class="card-date">{formatDate(m.date)}</time>
                  <span
                    class="card-badge"
                    style="background: {CATEGORY_COLORS[
                      m.category
                    ]}15; color: {CATEGORY_COLORS[m.category]}"
                    >{m.category}</span
                  >
                </div>
                <h3 class="card-title">{m.title}</h3>
                {#if m.location}
                  <span class="card-location">📍 {m.location}</span>
                {/if}
                <p class="card-desc">
                  {m.description.length > 120
                    ? m.description.slice(0, 120) + "…"
                    : m.description}
                </p>
              </div>
            </div>
          </button>
        {/each}
      {/each}

      <div class="timeline-end">
        <div class="track-col year-track">
          <div class="end-dot">💕</div>
        </div>
      </div>
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

  /* ─── Timeline layout ─── */
  .timeline {
    --track-w: 48px;
    --line-w: 3px;
    --dot-size: 16px;
    position: relative;
    transform-origin: top left;
    transform: scale(var(--zoom));
    padding-bottom: 1rem;
  }

  /* Continuous vertical line — centered in the track column */
  .timeline::before {
    content: "";
    position: absolute;
    left: calc(var(--track-w) / 2);
    top: 0;
    bottom: 0;
    width: var(--line-w);
    background: linear-gradient(
      to bottom,
      var(--accent) 0%,
      var(--timeline-line) 6%,
      var(--timeline-line) 94%,
      var(--accent) 100%
    );
    border-radius: var(--line-w);
    transform: translateX(-50%);
  }

  /* ─── Year marker row ─── */
  .year-row {
    display: grid;
    grid-template-columns: var(--track-w) 1fr;
    align-items: center;
    margin-bottom: 1.25rem;
    margin-top: 2.25rem;
    position: relative;
    z-index: 2;
  }

  .year-row.first {
    margin-top: 0;
  }

  .year-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    margin: 0 auto;
    position: relative;
    z-index: 2;
    box-shadow:
      0 0 0 4px var(--bg-primary),
      0 0 0 6px var(--accent);
  }

  .year-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 1.1rem;
    background: var(--accent);
    color: white;
    border-radius: var(--radius-full);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    width: fit-content;
    box-shadow: var(--shadow-sm);
  }

  /* ─── Milestone entry ─── */
  .entry {
    display: grid;
    grid-template-columns: var(--track-w) 1fr;
    border: none;
    background: none;
    text-align: left;
    padding: 0;
    width: 100%;
    cursor: pointer;
    margin-bottom: 1.5rem;
    font-family: inherit;
    color: inherit;
  }

  /* Track column — dot sits here, centered on the line */
  .track-col {
    display: flex;
    justify-content: center;
    padding-top: 1.25rem;
    position: relative;
  }

  .year-track {
    padding-top: 0;
  }

  .dot {
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;
    background: var(--dot-color);
    border: 3px solid var(--bg-primary);
    box-shadow: 0 0 0 2px var(--dot-color);
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .entry:hover .dot {
    transform: scale(1.4);
    box-shadow:
      0 0 0 3px var(--dot-color),
      0 0 14px rgba(99, 102, 241, 0.3);
  }

  /* ─── Card ─── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: all 0.25s ease;
    max-width: 520px;
  }

  .entry:hover .card {
    box-shadow: var(--shadow-md);
    border-color: var(--accent);
    transform: translateX(4px);
  }

  .card-thumb {
    width: 100%;
    height: 160px;
    overflow: hidden;
  }

  .card-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  .entry:hover .card-thumb img {
    transform: scale(1.05);
  }

  .card-body {
    padding: 1rem 1.25rem 1.1rem;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
    flex-wrap: wrap;
  }

  .card-icon {
    font-size: 1rem;
  }

  .card-date {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .card-badge {
    margin-left: auto;
    display: inline-block;
    padding: 0.15rem 0.55rem;
    border-radius: var(--radius-full);
    font-size: 0.7rem;
    font-weight: 600;
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
    line-height: 1.35;
  }

  .card-location {
    font-size: 0.78rem;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.3rem;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0;
  }

  /* ─── End cap ─── */
  .timeline-end {
    display: grid;
    grid-template-columns: var(--track-w) 1fr;
    padding-top: 0.5rem;
  }

  .end-dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--accent);
    margin: 0 auto;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    box-shadow:
      0 0 0 4px var(--bg-primary),
      0 0 0 6px var(--accent),
      0 0 20px rgba(99, 102, 241, 0.3);
  }

  /* ─── Responsive ─── */
  @media (max-width: 600px) {
    h1 {
      font-size: 1.35rem;
    }

    .timeline {
      --track-w: 36px;
      --dot-size: 14px;
    }

    .card {
      max-width: none;
    }

    .card-thumb {
      height: 120px;
    }

    .card-body {
      padding: 0.85rem 1rem;
    }

    .year-badge {
      font-size: 0.78rem;
      padding: 0.3rem 0.85rem;
    }
  }
</style>
