<script>
  import { onMount } from "svelte";
  import { milestones, selectedMilestone } from "$lib/stores/milestones";
  import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from "$lib/types";
  import Chart from "chart.js/auto";

  let allMilestones = $state([]);
  milestones.subscribe((v) => (allMilestones = v));

  let barCanvas = $state(null);
  let pieCanvas = $state(null);
  let barChart = null;
  let pieChart = null;

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      text: style.getPropertyValue("--text-primary").trim(),
      textSecondary: style.getPropertyValue("--text-secondary").trim(),
      grid: style.getPropertyValue("--border-color").trim(),
      bg: style.getPropertyValue("--bg-card").trim(),
    };
  }

  function getMilestonesByYear() {
    const counts = {};
    for (const m of allMilestones) {
      const year = new Date(m.date).getFullYear();
      counts[year] = (counts[year] || 0) + 1;
    }
    const years = Object.keys(counts).sort();
    return { labels: years, data: years.map((y) => counts[y]) };
  }

  function getMilestonesByCategory() {
    const counts = {};
    for (const m of allMilestones) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    const cats = Object.keys(counts);
    return {
      labels: cats,
      data: cats.map((c) => counts[c]),
      colors: cats.map((c) => CATEGORY_COLORS[c] || "#6366f1"),
    };
  }

  function getMilestonesByMonth() {
    const counts = Array(12).fill(0);
    for (const m of allMilestones) {
      counts[new Date(m.date).getMonth()]++;
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return { labels: months, data: counts };
  }

  function buildCharts() {
    if (!barCanvas || !pieCanvas) return;

    const theme = getThemeColors();

    // Destroy existing charts
    barChart?.destroy();
    pieChart?.destroy();

    const byYear = getMilestonesByYear();
    const byCat = getMilestonesByCategory();

    barChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: byYear.labels,
        datasets: [
          {
            label: "Milestones",
            data: byYear.data,
            backgroundColor: "#6366f180",
            borderColor: "#6366f1",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: "#6366f1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Milestones Per Year",
            color: theme.text,
            font: { size: 16, weight: "700" },
            padding: { bottom: 20 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: theme.textSecondary,
              font: { size: 12 },
            },
            grid: { color: theme.grid + "40" },
          },
          x: {
            ticks: {
              color: theme.textSecondary,
              font: { size: 12 },
            },
            grid: { display: false },
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0) {
            const year = byYear.labels[elements[0].index];
            const matching = allMilestones.filter(
              (m) => new Date(m.date).getFullYear() === Number(year),
            );
            if (matching.length > 0) selectedMilestone.set(matching[0]);
          }
        },
      },
    });

    pieChart = new Chart(pieCanvas, {
      type: "doughnut",
      data: {
        labels: byCat.labels,
        datasets: [
          {
            data: byCat.data,
            backgroundColor: byCat.colors.map((c) => c + "cc"),
            borderColor: byCat.colors,
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: theme.text,
              padding: 16,
              font: { size: 13 },
              usePointStyle: true,
              pointStyleWidth: 12,
            },
          },
          title: {
            display: true,
            text: "Category Distribution",
            color: theme.text,
            font: { size: 16, weight: "700" },
            padding: { bottom: 20 },
          },
        },
        onClick: (_, elements) => {
          if (elements.length > 0) {
            const cat = byCat.labels[elements[0].index];
            const matching = allMilestones.filter((m) => m.category === cat);
            if (matching.length > 0) selectedMilestone.set(matching[0]);
          }
        },
      },
    });
  }

  onMount(() => {
    // Small delay to ensure DOM ready
    const timer = setTimeout(buildCharts, 100);
    return () => clearTimeout(timer);
  });

  // Rebuild when data changes
  $effect(() => {
    if (allMilestones && barCanvas && pieCanvas) {
      buildCharts();
    }
  });
</script>

<div class="page">
  <div class="header">
    <h1>📊 Charts & Analytics</h1>
    <p>Visualize your milestone data at a glance.</p>
  </div>

  {#if allMilestones.length === 0}
    <div class="empty">
      <p>
        No data to visualize yet. <a href="/add-milestone">Add milestones</a> to
        see charts!
      </p>
    </div>
  {:else}
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-wrapper">
          <canvas bind:this={barCanvas}></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-wrapper pie-wrapper">
          <canvas bind:this={pieCanvas}></canvas>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <h2>Monthly Activity</h2>
      <div class="monthly-grid">
        {#each getMilestonesByMonth().labels as month, i}
          {@const count = getMilestonesByMonth().data[i]}
          <div class="month-cell" class:active={count > 0}>
            <span class="month-name">{month}</span>
            <span class="month-count">{count}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="summary-section">
      <h2>Quick Stats</h2>
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-val">{allMilestones.length}</span>
          <span class="stat-lbl">Total Milestones</span>
        </div>
        <div class="stat">
          <span class="stat-val">{getMilestonesByYear().labels.length}</span>
          <span class="stat-lbl">Years Covered</span>
        </div>
        <div class="stat">
          <span class="stat-val">{getMilestonesByCategory().labels.length}</span
          >
          <span class="stat-lbl">Categories Used</span>
        </div>
        <div class="stat">
          <span class="stat-val"
            >{allMilestones.filter((m) => m.location).length}</span
          >
          <span class="stat-lbl">With Locations</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .header h1 {
    font-size: 1.75rem;
    font-weight: 800;
  }

  .header p {
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .empty {
    text-align: center;
    padding: 4rem 1rem;
    background: var(--bg-card);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 1.5rem;
  }

  .chart-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
  }

  .chart-wrapper {
    position: relative;
    height: 320px;
  }

  .pie-wrapper {
    height: 360px;
  }

  .summary-section {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
  }

  .summary-section h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .monthly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.5rem;
  }

  .month-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6rem 0.4rem;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    transition: all 0.2s;
  }

  .month-cell.active {
    background: var(--accent-light);
  }

  .month-name {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .month-count {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .month-cell.active .month-count {
    color: var(--accent);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }

  .stat {
    text-align: center;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }

  .stat-val {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--accent);
  }

  .stat-lbl {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
