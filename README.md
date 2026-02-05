# eBilet Ticket Monitor

Real-time dashboard for monitoring concert ticket availability across primary and secondary markets. Built with **Next.js 16**, **TypeScript**, and **PostgreSQL**.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/zioms-projects-68524e26/v0-ebilet-ticket-monitor)

## Features

- **Live Ticket Tracking** — monitors 43+ sectors on eBilet.pl in real-time, with automatic snapshot storage when availability changes
- **Secondary Market Analysis** — scrapes AleBilet.pl listings, detects sold offers by comparing snapshots, and tracks average resale prices
- **Sales Velocity & Predictions** — calculates tickets/minute rate and predicts sellout date based on current trends
- **Interactive Charts** — area charts with configurable time ranges (1h / 6h / 12h / 24h / All) built with Recharts, with data sampling for performance
- **Sector Status Dashboard** — accordion-based view grouped by zone (Red / Yellow / Green / GA) with color-coded availability badges
- **Toast Notifications** — real-time alerts when watched sectors become available or resale tickets are sold
- **Fully Responsive** — mobile-first design with collapsible sidebar navigation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS 4, Radix UI, Lucide Icons |
| Charts | Recharts |
| Database | PostgreSQL (Neon serverless) |
| Forms | React Hook Form + Zod validation |
| Deployment | Vercel (with cron jobs) |

## Architecture

```
app/
├── api/
│   ├── tickets/       → eBilet.pl API integration (seat counts per sector)
│   ├── history/       → Historical snapshots with incremental fetch support
│   ├── alebilet/      → AleBilet.pl HTML scraper + sold ticket detection
│   └── cron/          → Vercel cron trigger for automated data refresh
├── page.tsx           → Main dashboard with state management
└── layout.tsx         → Root layout with DM Sans font

components/
├── pages/             → Overview, Sectors, AleBilet page components
├── velocity-chart.tsx → Sales velocity area chart with time filters
├── ga-chart.tsx       → General Admission tracking chart
├── sector-accordion.tsx → Zone-grouped sector grid with status badges
├── alebilet-sold.tsx  → Resale sold tickets table with pagination
├── sidebar.tsx        → Responsive navigation sidebar
└── ui/                → 12+ Radix-based primitives

lib/
├── types.ts           → Shared TypeScript type definitions
├── api.ts             → Client-side API fetch functions
├── db.ts              → Neon connection pool
└── db-queries.ts      → SQL query layer
```

## How It Works

**Data Collection** — API routes fetch ticket data from eBilet.pl (via their sector API) and scrape AleBilet.pl listings. Snapshots are stored in PostgreSQL only when counts change, keeping the database lean.

**Sold Ticket Detection** — The system compares consecutive AleBilet snapshots. When an offer disappears between fetches, it's recorded as sold with full metadata (category, sector, row, price, timestamp).

**Analytics Pipeline** — The client fetches historical snapshots and computes velocity metrics, percentage changes, and sellout predictions in real-time. Charts sample data to max 50 points for smooth rendering.

**Automated Refresh** — A Vercel cron job triggers hourly server-side refreshes. The dashboard auto-refreshes every 15 minutes on the client, with a visible timer showing seconds since last update.

## Database Schema

Three tables in Neon PostgreSQL:

- **`ticket_snapshots`** — timestamped records of total available tickets + per-sector JSONB data (deduplicated, only stored on change)
- **`alebilet_snapshots`** — point-in-time resale offer listings per event
- **`alebilet_sold`** — detected sold tickets with category, sector, row, quantity, price, and sold timestamp

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Required: NEON_DATABASE_URL, EBILET_COOKIE, CRON_SECRET

# Run development server
npm run dev
```

## Screenshots

The dashboard features a dark-themed UI with three main views:

1. **Overview** — hero stats (available tickets, hourly sales, velocity, sellout prediction) + velocity/GA charts
2. **Sectors** — expandable zone groups with per-sector availability cards and status badges
3. **AleBilet** — resale market stats, event cards with category breakdowns, and sold tickets history table
