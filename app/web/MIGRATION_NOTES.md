# Unified Web App Migration Notes

## What moved

- `apps/landing` was used as the baseline for `apps/web`.
- Landing public routes were moved into `src/app/(public)` so their URLs remain unchanged.
- Dashboard pages were copied under `src/app/(dashboard)/dashboard`.
- Admin pages were copied under `src/app/(admin)/admin`.
- Dashboard API proxy routes were copied into `src/app/api/dashboard`.
- Admin API proxy routes were copied into `src/app/api/admin` plus `src/app/api/cards`.
- The existing landing `/api/orders` route now also supports the admin `GET /api/orders` behavior.
- The three UploadThing routers were merged into one `src/app/api/uploadthing/core.ts`.
- A unified Clerk middleware/proxy was added in `src/proxy.ts`.

## Preserved routes

- `/`
- `/members`
- `/apply`
- `/membership`
- `/payment-link/[token]`
- `/success`
- `/dashboard`
- `/dashboard/profile/edit`
- `/dashboard/notifications`
- `/dashboard/success`
- `/admin`
- `/admin/applications`
- `/admin/clients`
- `/admin/content`
- `/admin/mailing`
- `/admin/partners`

## Required env variables

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_LANDING_URL`
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ADMIN_INTERNAL_KEY`
- `ADMIN_EMAILS`
- `UPLOADTHING_TOKEN`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` if reCAPTCHA is enabled

Backend-only secrets stay in `apps/backend/.env`; `apps/web` calls the backend rather than owning database, Stripe webhook, or Clerk webhook logic.

## Verification completed

- `npm install`
- `npm run build -w web`
- `npm run lint -w web`

## Manual testing checklist

- Public: `/`, `/members`, `/apply`, `/membership`
- Dashboard: `/dashboard`, `/dashboard/profile/edit`, `/dashboard/notifications`, `/dashboard/success`
- Admin: `/admin`, `/admin/applications`, `/admin/clients`, `/admin/content`, `/admin/mailing`
- Uploads: application portfolio images, dashboard avatar upload, admin certificate/content uploads
- Payments: application submit, payment link, sponsorship checkout, Stripe webhook forwarding to backend
- Auth: public access, dashboard sign-in guard, admin allowlist guard

## Known TODOs

- Existing lint warnings about raw `<img>` usage and one inherited `useMemo` dependency remain unchanged.
- Keep `apps/landing`, `apps/dashboard`, and `apps/admin` until the unified app is manually verified.
- Production deployment still needs provider env variables copied into the new `web` app configuration.
