# ESG Strategy Hub – Actions Prototype

A high-fidelity web app prototype recreating the "ESG Strategy Hub > Actions" area.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + TypeScript + Express
- **Database**: SQLite (file-based) via Prisma ORM

## Quick Start

```bash
# Install all dependencies
npm install

# Run database migration + seed
npm run db:migrate
npm run db:seed

# Start both apps (backend :4000, frontend :5173)
npm run dev
```

Or run the full setup in one command:

```bash
npm run setup && npm run dev
```

## Project Structure

```
├── apps/
│   ├── backend/          # Express API + Prisma + SQLite
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/          # Express server
│   └── frontend/         # React + Vite + Tailwind
│       └── src/
│           ├── components/  # Layout, sidebar, modals
│           └── pages/       # ActionsOverview, ActionDetail
├── package.json          # Workspace root with concurrently
└── README.md
```

## API Endpoints

| Method | Path               | Description          |
|--------|--------------------|----------------------|
| GET    | /api/users         | List all users       |
| GET    | /api/actions       | List actions (filter/sort) |
| GET    | /api/actions/:id   | Get single action    |
| POST   | /api/actions       | Create action        |
| PATCH  | /api/actions/:id   | Update action        |
| DELETE | /api/actions/:id   | Delete action        |

Query params for GET /api/actions: `q`, `status`, `sortBy`, `sortDir`
