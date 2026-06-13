# GreenLeaf Dashboard

Overview
- GreenLeaf is a Vite + React dashboard that visualizes agricultural data for precision greenhouse/farm management. It provides KPI cards, charts, and pages for overview and sectional analyses (Part A/B/C).

Key features
- Interactive charts and KPIs summarizing sensor readings and input costs.
- Multiple pages: `Overview`, `PartA`, `PartB`, `PartC` (see `greenleaf-app/greenleaf-app/src/pages`).
- Uses local CSV/data files (development) and a bundled `data.json` for demo data.

Run locally
1. Open a terminal and navigate to the frontend folder:

```powershell
cd greenleaf-app/greenleaf-app
```

2. Install dependencies and run dev server:

```powershell
npm install
npm run dev
```

3. Open the URL shown by Vite (usually `http://localhost:5173`).

Build for production

```powershell
cd greenleaf-app/greenleaf-app
npm install
npm run build
```

The production build output is in `dist/`.

Deploy to Vercel
- Connect the GitHub repo to Vercel and set the project root to `greenleaf-app/greenleaf-app`.
- Build command: `npm run build` — Output directory: `dist`.

CLI deploy (optional):

```bash
npm i -g vercel
cd greenleaf-app/greenleaf-app
vercel login
vercel --prod
```

Notes
- Data files (CSV) and local previews are excluded from the repo via `.gitignore` — add any production data sources via environment variables or external storage.
- Frontend source is at `greenleaf-app/greenleaf-app/src`.

Questions or next steps
- Want a `vercel.json` added to the project or a GitHub Action for CI? I can add either.
# GreenLeaf