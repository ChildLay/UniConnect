# UniConnect Hub React Web

Version 1 browser client for the UniConnect Hub ASP.NET Core API.

## Requirements

- Node.js 22 LTS or newer
- npm 10 or newer
- Backend API and its SQL Server database for live features

## Setup

From the repository root:

```powershell
npm ci
Copy-Item .env.development.example .env.development.local
npm run dev
```

The frontend appends `/api/v1` to `VITE_API_BASE_URL`; set only the API origin. No backend secrets belong in frontend environment variables. Use HTTPS for local API development and trust the ASP.NET development certificate.

## Environment profiles

Vite loads `.env.development.local` for `npm run dev`, `.env.uat.local` for `npm run dev:uat` and `npm run build:uat`, and `.env.production.local` for the production build (`npm run build`). Copy the matching example file to the corresponding `.local` filename and replace its API origin with the real environment URL:

```powershell
Copy-Item .env.uat.example .env.uat.local
npm run dev:uat
npm run build:uat
```

For a live build, copy `.env.production.example` to `.env.production.local`, set the production API origin, then run `npm run build`. The `.local` environment files are ignored by Git. Example URLs are placeholders and must be replaced before use.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

## Open and run in Visual Studio

Install the **Node.js development** workload in Visual Studio 2022, then open `UniConnect.ReactWeb.sln`. Restore frontend packages once from the project directory with `npm ci`. Select `UniConnect.ReactWeb` as the startup project and press **F5** (or **Ctrl+F5**) to run Vite at `http://localhost:5173`. The project file maps Visual Studio's start action to `npm run dev` and its build action to `npm run build`.

If Visual Studio reports that the JavaScript project system is unavailable, use Visual Studio Installer → Modify and install the Node.js development workload, then reopen the solution.

## Structure

- `src/App.tsx` owns the shell, responsive navigation, protected route tree and admin gate.
- `src/api.ts` owns the single Axios client, bearer header, refresh rotation, session storage and typed DTOs.
- `src/auth-feed.tsx`, `src/community-events.tsx`, `src/network-growth.tsx`, `src/profile-settings.tsx`, and `src/post-moderation.tsx` contain feature screens and feature queries/mutations.
- `src/shared.tsx` contains reusable page headings, loading/error/empty states and avatars.
- `src/index.css` defines design tokens, shadcn-style primitives and responsive layouts.
- TanStack Query owns server data and invalidation/refetch. There is no global client state store.

## Authentication

Login and registration use `/api/v1/auth`. Access and refresh tokens are held in `sessionStorage` for this browser tab. The Axios response interceptor rotates the refresh token after an eligible 401 and clears the session when rotation fails. Logout revokes the current refresh token. The browser client does not log tokens. Backend authorization remains authoritative; client route visibility is only navigation UX.

## API contract

The client was implemented against the API guide and DTO source in the sibling `UniConnectHub` backend repository. The configured local Swagger endpoint was not running during implementation, so an HTTP OpenAPI snapshot could not be retrieved. See `docs/frontend-architecture.md` for endpoint coverage and contract gaps.

Profile and cover photos use authenticated multipart routes: `POST /api/v1/profiles/me/media/profile` and `POST /api/v1/profiles/me/media/cover` with a `file` form field. Use JPEG, PNG, or WebP files up to 5 MB. Matching DELETE routes remove each image. Image GET requests require authentication and apply the backend profile visibility rules.

## Forms and validation

Login validation uses React Hook Form and Zod; other feature forms use semantic native controls and explicit DTO mapping. Backend validation remains authoritative.

## Responsive behavior

At wide screens the interface has a left sidebar, central content and contextual rail; the rail collapses at 1200px. At 760px and below the sidebar becomes a drawer and a five-item bottom bar appears. Focus indicators, 44px-plus primary controls, accessible labels, reduced-motion rules, semantic forms and safe external links are included.

## Known API-driven limitations

The current backend has no comment-list route, community post/event/member-profile routes, event venue/link/audience fields, post author/community display fields, notification unread-count endpoint, invitation management or connection-request listing by blocked-user details. The frontend does not synthesize those values. See the architecture note for the full list.


