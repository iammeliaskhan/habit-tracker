# Habit Tracker
A small, local-first habit tracker built with Next.js and Prisma.

## Features
- Create/delete habits (optional color)
- Toggle daily completion per habit (date picker supported)
- Stats view with a 30-day completion percentage chart
- SQLite database via Prisma (easy local setup)

## Tech stack
- Next.js (App Router) + React
- TypeScript
- Prisma + SQLite
- Tailwind CSS
- Zod for request validation
- Recharts for charts

## Requirements
- Node.js 18+ (recommended)
- npm

## Quick start
Install dependencies:
```bash
npm install
```

Set up the database (creates `dev.db`, runs migrations, generates Prisma Client):
```bash
npm run prisma:migrate -- --name init
```

Optional: seed example habits:
```bash
npm run seed
```

Run the app:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Project structure
- `src/app/` — Next.js routes (UI + API route handlers)
- `src/components/` — UI components
- `src/lib/` — shared utilities (Prisma client, date helpers, Zod schemas)
- `prisma/` — Prisma schema, migrations, seed

## NPM scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run prisma:generate` — generate Prisma Client
- `npm run prisma:migrate` — create/apply migrations (dev)
- `npm run prisma:studio` — open Prisma Studio
- `npm run seed` — seed database with sample habits

## API overview
These are internal endpoints used by the UI:
- `GET /api/habits?date=YYYY-MM-DD` — list habits and completion state for date
- `POST /api/habits` — create a habit (`{ name, color? }`)
- `PATCH /api/habits/:id` — update habit (`{ name?, color?, archived? }`)
- `DELETE /api/habits/:id` — delete habit
- `POST /api/habits/:id/checkins` — toggle completion (`{ date: YYYY-MM-DD }`)

## Notes
- Data is stored locally in SQLite (`dev.db`).
- Dates are treated as UTC days (`YYYY-MM-DD`) to keep check-ins consistent.

## Next ideas
- Auth + multi-user support
- Habit schedules (e.g. weekdays only)
- Streaks and reminders
- Drag-and-drop ordering
