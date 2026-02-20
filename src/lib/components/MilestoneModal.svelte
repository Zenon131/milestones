<script>
  import { selectedMilestone, milestones } from "$lib/stores/milestones";
  import { getImage } from "$lib/stores/imageStore";
  import { CATEGORY_COLORS, CATEGORY_ICONS } from "$lib/types";

  let milestone = $state(null);
  let resolvedImageSrc = $state("");
  selectedMilestone.subscribe((v) => (milestone = v));

  // Resolve imageId to data URL whenever milestone changes
  $effect(() => {
    if (milestone?.imageId) {
      getImage(milestone.imageId).then((img) => {
        resolvedImageSrc = img?.data || "";
      });
    } else {
      resolvedImageSrc = "";
    }
  });

  function getImageSrc() {
    if (resolvedImageSrc) return resolvedImageSrc;
    if (milestone?.imageUrl) return milestone.imageUrl;
    return "";
  }

  function close() {
    selectedMilestone.set(null);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") close();
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function deleteMilestone() {
    if (milestone && confirm("Remove this milestone?")) {
      milestones.remove(milestone.id);
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if milestone}
  <div class="modal-overlay" role="dialog" aria-modal="true">
    <button class="backdrop" onclick={close} aria-label="Close"></button>
    <div class="modal">
      <div class="modal-header">
        <div
          class="category-badge"
          style="background: {CATEGORY_COLORS[
            milestone.category
          ]}20; color: {CATEGORY_COLORS[milestone.category]}"
        >
          <span>{CATEGORY_ICONS[milestone.category]}</span>
          {milestone.category}
        </div>
        <button class="close-btn" onclick={close} aria-label="Close">✕</button>
      </div>

      {#if getImageSrc()}
        <div class="image-container">
          <img src={getImageSrc()} alt={milestone.title} />
        </div>
      {/if}

      <div class="modal-body">
        <h2>{milestone.title}</h2>
        <p class="date">{formatDate(milestone.date)}</p>

        {#if milestone.location}
          <p class="location">📍 {milestone.location}</p>
        {/if}

        <p class="description">{milestone.description}</p>
      </div>

      <div class="modal-footer">
        <button class="delete-btn" onclick={deleteMilestone}>
          🗑️ Remove
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    background: var(--bg-overlay);
    border: none;
    cursor: default;
  }

  .modal {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 560px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    animation: modalIn 0.25s ease;
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .category-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--danger);
    color: white;
  }

  .image-container {
    width: 100%;
    max-height: 300px;
    overflow: hidden;
  }

  .image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .date {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .location {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .description {
    color: var(--text-primary);
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
  }

  .delete-btn {
    padding: 0.5rem 1rem;
    background: none;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: var(--danger);
    color: white;
  }
</style>
