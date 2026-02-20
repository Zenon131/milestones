<script>
  import "../app.css";
  import Nav from "$lib/components/Nav.svelte";
  import MilestoneModal from "$lib/components/MilestoneModal.svelte";
  import { milestones, theme } from "$lib/stores/milestones";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    milestones.init();
    theme.init();
  });
</script>

<Nav />
<main>
  {@render children()}
</main>
<MilestoneModal />

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    min-height: calc(100vh - 64px);
  }
</style>
