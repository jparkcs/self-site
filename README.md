# Dynamic Workout Tracker

Local Vite + Tailwind SPA to view weekly workouts. Data lives in `data/workouts.json`.

Quick start:

```powershell
npm install
npm run dev
```

Replace GIF placeholders in `public/placeholders/` with your actual GIFs.

Deployment
----------

This project is intended to be deployed as a static site. I deploy it to Vercel using the GitHub import flow. Recommended Vercel settings:

- Build Command: `npm run build`
- Output Directory: `dist`

To deploy using the Vercel web UI:

1. Sign into Vercel and choose "Import Project" → connect your GitHub account.
2. Select the `self-site` repository (or the repo for this workspace).
3. Set the Build Command to `npm run build` and the Output Directory to `dist`.
4. Deploy — Vercel will build and publish the site.

To deploy via the Vercel CLI (optional):

```powershell
npm i -g vercel
vercel login
vercel --prod
```

Adjusting the site
------------------

- Change workouts: edit `data/workouts.json` and commit. The SPA reads this JSON at runtime.
- Replace placeholders: put GIFs or other assets in `public/placeholders/` using the same filenames referenced in `data/workouts.json`.
- Test a production build locally:

```powershell
npm run build
npm run preview
```

Notes
-----
- The `public/placeholders/` directory is served from the project root in dev and production. Use `/placeholders/<file>` paths in the data file.
- Keep the repository lightweight: prefer small SVG placeholders in `public/placeholders/` if you don't want to commit large GIFs.
