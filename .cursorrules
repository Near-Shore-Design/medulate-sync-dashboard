# medulate-sync-dashboard — AI Context & Engineering Guide

Institutional web dashboard for medical residency programs, nursing schools, and simulation center coordinators to monitor trainee procedural progress and credentialing across cohorts.

---

## 1. System Role & Architecture

- **Role**: Administrative & educator dashboard. Manages student rosters, tracks procedure performance, visualizes needle/catheter metrics, deduplicates patient case catalogs, and audits competency verification.
- **Tech Stack**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Radix UI + TanStack React Query + Lucide React.
- **Backend API**: Connects to `https://medulate-api.onrender.com/api` (configured via `VITE_API_URL`).
- **Hosting**: Vercel (`vercel.json`), mapped to `account.medulate.com` or Vercel preview URLs.
- **Active Branch**: `main`.

---

## 2. Key Directories & Patterns

| Directory / File | Description |
|---|---|
| `src/services/` | API client methods for `medulate-api`. JWT bearer injection and refresh interceptors. |
| `src/contexts/` | Global authentication and active tenant/institution state. |
| `src/pages/` | `Dashboard.tsx`, `Students.tsx` / `Trainees.tsx`, `Cases.tsx`, `Analytics.tsx`. |
| `src/components/ui/` | shadcn/ui component primitives. Never modify internals without checking shadcn conventions. |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge). |

---

## 3. Build & Run

```bash
# Install dependencies (use npm, package-lock.json is canonical)
npm install

# Start local dev server (port 5173 by default)
npm run dev

# Production build & lint
npm run lint
npm run build
```

### Environment Configuration
Create `.env` based on `.env.example`:
```env
VITE_API_URL="https://medulate-api.onrender.com/api"
```

---

## 4. Key Domain Rules & Gotchas

1. **Student Unenrollment / Deletion**: When an administrator removes a trainee, the API triggers a full cascading delete of the trainee's user account and associated session telemetry.
2. **Case Catalog Deduplication**: Ensure patient cases are deduped by case identifier when aggregated across multi-institution cohorts so instructors don't see duplicate entries.
3. **Pagination & Rosters**: Ensure API calls append `?page_size=100` (or appropriate page size) so larger residency cohorts are not cut off at 20 trainees.
4. **Token Refresh**: All API requests pass `Authorization: Bearer <access_token>`. When receiving 401, automatically trigger `/api/auth/token/refresh/` before logging out.
