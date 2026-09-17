# Releasing medulate-sync-dashboard

The dashboard is a static Vite/React site hosted on Vercel
(`account.medulate.com`). Nobody installs it: users open it in a browser. A new
version means a new Vercel production deploy. A "new installation" means a new
Vercel project or domain.

Release paths for all four repos:

| Repo | Ships as | Release doc |
|---|---|---|
| `sophia-remake` + `unity_sophia_remake` | `Sophia_Installer-<ver>.exe`, installed on rig PCs, which then update themselves | `sophia-remake/RELEASING.md`, `sophia-remake/INSTALLING.md` |
| `medulate-api` | Render web service + Render Postgres | `medulate-api/RELEASING.md` |
| `medulate-sync-dashboard` | Vercel static site | this file |

## New development machine

```powershell
git clone https://github.com/Near-Shore-Design/medulate-sync-dashboard.git
cd medulate-sync-dashboard
powershell -ExecutionPolicy Bypass -File scripts\setup_dev.ps1
```

This needs only Node.js (`winget install OpenJS.NodeJS.LTS`). The script
installs dependencies, creates `.env`, then runs the tests and a production
build. To set up all four repos at once, use
`sophia-remake\tools\bootstrap_build_machine.ps1`.

## Releasing a new version

1. **Check locally:** run `npm test`, `npm run lint` and `npm run build`. The
   build is exactly what Vercel runs.
2. **Open a PR.** Vercel builds a preview URL for it
   (`medulate-sync-dashboard-*.vercel.app`). The API's CORS already allows
   those preview URLs, so you can log in to the preview against the real API
   and click through.
3. **Merge to `main`.** Vercel builds and promotes it to production.
4. **Tag the release:** `git tag dashboard-YYYY.MM.DD && git push origin dashboard-YYYY.MM.DD`.
5. **Smoke test:** log in at `https://account.medulate.com`, then cold-load a
   deep link such as `/signup?code=TEST` to confirm the SPA rewrite in
   `vercel.json` still works.

**Rollback:** in Vercel, open *Deployments*, pick the last good production
deploy and choose *Promote to Production* (or *Instant Rollback*). This takes
seconds and needs no rebuild.

**If the release depends on an API change,** deploy the API first
(`medulate-api/RELEASING.md`). The dashboard must never call an endpoint that
production doesn't serve yet.

## Vercel project settings (source of truth)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm ci` (see the note below) |
| Production branch | `main` |
| Env: `VITE_API_URL` | `https://medulate-api.onrender.com/api` (Production and Preview) |
| Domain | `account.medulate.com` |

> **Lockfiles:** the repo contains both `package-lock.json` and `bun.lockb`.
> Vercel chooses the package manager from the lockfile, so the deployed
> dependency tree can differ from what `npm ci` installs locally. Set the
> Install Command explicitly to `npm ci`, or delete whichever lockfile isn't
> kept up to date.

`VITE_API_URL` is read **at build time**. After you change it in Vercel,
redeploy for the change to take effect.
