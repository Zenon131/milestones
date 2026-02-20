<script>
  import { page } from "$app/stores";
  import ThemeToggle from "./ThemeToggle.svelte";

  let menuOpen = $state(false);

  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/timeline", label: "Timeline", icon: "📅" },
    { href: "/charts", label: "Charts", icon: "📊" },
    { href: "/add-milestone", label: "Add", icon: "✨" },
  ];

  let currentPath = $state("/");
  page.subscribe((p) => (currentPath = p.url.pathname));
</script>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="logo">
      <span class="logo-icon">💝</span>
      <span class="logo-text">Our Milestones</span>
    </a>

    <div class="nav-links" class:open={menuOpen}>
      {#each links as link}
        <a
          href={link.href}
          class="nav-link"
          class:active={currentPath === link.href}
          onclick={() => (menuOpen = false)}
        >
          <span class="nav-icon">{link.icon}</span>
          <span>{link.label}</span>
        </a>
      {/each}
    </div>

    <div class="nav-actions">
      <ThemeToggle />
      <button
        class="hamburger"
        class:open={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</nav>

{#if menuOpen}
  <button
    class="overlay"
    onclick={() => (menuOpen = false)}
    aria-label="Close menu"
  ></button>
{/if}

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    backdrop-filter: blur(12px);
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--text-primary);
    text-decoration: none;
  }

  .logo-icon {
    font-size: 1.4rem;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-link.active {
    background: var(--accent-light);
    color: var(--accent);
  }

  .nav-icon {
    font-size: 1rem;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
  }

  .hamburger span {
    display: block;
    height: 2px;
    background: var(--text-primary);
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .hamburger.open span:nth-child(1) {
    transform: rotate(45deg) translate(4px, 6px);
  }
  .hamburger.open span:nth-child(2) {
    opacity: 0;
  }
  .hamburger.open span:nth-child(3) {
    transform: rotate(-45deg) translate(4px, -6px);
  }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: 90;
    border: none;
    cursor: default;
  }

  @media (max-width: 768px) {
    .nav-links {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      flex-direction: column;
      padding: 1rem;
      gap: 0.5rem;
      transform: translateY(-120%);
      transition: transform 0.3s ease;
      z-index: 95;
    }

    .nav-links.open {
      transform: translateY(0);
    }

    .nav-link {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
    }

    .hamburger {
      display: flex;
    }

    .overlay {
      display: block;
    }

    .logo-text {
      display: none;
    }
  }
</style>
