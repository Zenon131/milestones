<script>
  import { milestones } from "$lib/stores/milestones";
  import { CATEGORY_COLORS, CATEGORY_ICONS } from "$lib/types";

  let allMilestones = $state([]);
  milestones.subscribe((v) => (allMilestones = v));

  $effect(() => {
    totalCount = allMilestones.length;
  });

  let totalCount = $state(0);

  function getCategoryCounts() {
    const counts = {};
    for (const m of allMilestones) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function getYearRange() {
    if (allMilestones.length === 0) return "";
    const years = allMilestones.map((m) => new Date(m.date).getFullYear());
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? `${min}` : `${min} – ${max}`;
  }

  function getLatestMilestones() {
    return [...allMilestones].reverse().slice(0, 3);
  }

  async function handleExport() {
    const json = await milestones.exportWithImages();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "milestones.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  let importMsg = $state("");

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = await milestones.importJSON(reader.result);
      importMsg = result.success
        ? `✅ Imported ${result.count} milestones`
        : `❌ Import failed: ${result.error}`;
      setTimeout(() => (importMsg = ""), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }
</script>

<div class="home">
  <section class="hero">
    <h1>💝 Our Journey Together</h1>
    <p class="subtitle">
      Every moment matters. Let's track, visualize, and celebrate our shared
      milestones.
    </p>
  </section>

  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-number">{totalCount}</span>
      <span class="stat-label">Milestones</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">{getCategoryCounts().length}</span>
      <span class="stat-label">Categories</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">{getYearRange() || "—"}</span>
      <span class="stat-label">Year Range</span>
    </div>
  </div>

  {#if allMilestones.length > 0}
    <section class="section">
      <h2>Recent Milestones</h2>
      <div class="recent-list">
        {#each getLatestMilestones() as m}
          <div class="recent-card">
            <span
              class="recent-icon"
              style="color: {CATEGORY_COLORS[m.category]}"
              >{CATEGORY_ICONS[m.category]}</span
            >
            <div class="recent-info">
              <strong>{m.title}</strong>
              <span class="recent-date"
                >{new Date(m.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}</span
              >
            </div>
            <span
              class="recent-cat"
              style="background: {CATEGORY_COLORS[
                m.category
              ]}20; color: {CATEGORY_COLORS[m.category]}">{m.category}</span
            >
          </div>
        {/each}
      </div>
    </section>

    <section class="section">
      <h2>Category Breakdown</h2>
      <div class="category-bars">
        {#each getCategoryCounts() as [cat, count]}
          <div class="bar-row">
            <span class="bar-label">{CATEGORY_ICONS[cat]} {cat}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width: {(count / totalCount) *
                  100}%; background: {CATEGORY_COLORS[cat]}"
              ></div>
            </div>
            <span class="bar-count">{count}</span>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <section class="empty">
      <p>
        ✨ No milestones yet. <a href="/add-milestone"
          >Add your first milestone</a
        > to get started!
      </p>
    </section>
  {/if}

  <section class="quick-nav">
    <a href="/timeline" class="nav-card">
      <span class="nav-card-icon">📅</span>
      <strong>Timeline</strong>
    </a>
    <a href="/charts" class="nav-card">
      <span class="nav-card-icon">📊</span>
      <strong>Charts</strong>
    </a>
    <a href="/add-milestone" class="nav-card highlight">
      <span class="nav-card-icon">✨</span>
      <strong>Add Milestone</strong>
    </a>
  </section>

  <section class="data-actions">
    <h2>Data Management</h2>
    <div class="action-row">
      <button class="action-btn" onclick={handleExport}>📤 Export JSON</button>
      <label class="action-btn">
        📥 Import JSON
        <input type="file" accept=".json" onchange={handleImport} hidden />
      </label>
    </div>
    {#if importMsg}
      <p class="import-msg">{importMsg}</p>
    {/if}
  </section>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .hero {
    text-align: center;
    padding: 2rem 0;
  }

  .hero h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 800;
    color: var(--accent);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .section h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .recent-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    transition: box-shadow 0.2s;
  }

  .recent-card:hover {
    box-shadow: var(--shadow-md);
  }

  .recent-icon {
    font-size: 1.5rem;
  }

  .recent-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .recent-date {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .recent-cat {
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .category-bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .bar-label {
    width: 120px;
    font-size: 0.85rem;
    font-weight: 500;
    flex-shrink: 0;
  }

  .bar-track {
    flex: 1;
    height: 10px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
  }

  .bar-count {
    width: 28px;
    text-align: right;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .empty {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--bg-card);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    font-size: 1.05rem;
  }

  .quick-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .nav-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 1.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    text-align: center;
    text-decoration: none;
    color: var(--text-primary);
    transition: all 0.2s ease;
  }

  .nav-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .nav-card.highlight {
    border-color: var(--accent);
    background: var(--accent-light);
  }

  .nav-card-icon {
    font-size: 2rem;
  }

  .nav-card strong {
    font-size: 1rem;
  }

  .nav-card span:last-child {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .data-actions h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .action-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 0.6rem 1.25rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
  }

  .import-msg {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--success);
  }

  @media (max-width: 600px) {
    .hero h1 {
      font-size: 1.75rem;
    }
  }
</style>
