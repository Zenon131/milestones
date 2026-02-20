# Relationship Milestones Visualization

An interactive web app built with **SvelteKit** and **Chart.js** for tracking, visualizing, and celebrating relationship milestones.

## Features

- **Timeline View** — Chronological milestone display with zoom, pan, and category filtering
- **Charts & Analytics** — Bar chart (milestones per year), doughnut chart (category distribution), monthly activity grid
- **Add Milestones** — Form with date, title, description, category, location, and image URL
- **Detail Modal** — Click any milestone to see full details
- **Data Persistence** — Milestones saved in browser localStorage
- **Import/Export** — Download milestones as JSON or import from file
- **Dark/Light Mode** — Theme toggle with system preference detection
- **Responsive** — Optimized for desktop, tablet, and mobile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

```bash
npm run build
npm run preview
```

The static output is in the `build/` directory, ready for deployment to Netlify, Vercel, or any static host.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home dashboard with summary stats |
| `/timeline` | Interactive chronological timeline |
| `/charts` | Data visualizations and analytics |
| `/add-milestone` | Form to add new milestones |

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) — Framework
- [Chart.js](https://www.chartjs.org/) — Charting library
- [Static Adapter](https://kit.svelte.dev/docs/adapter-static) — Static site generation
