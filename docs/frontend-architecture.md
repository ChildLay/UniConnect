# Frontend architecture and API contract

## Application structure

This repository is a Vite + React + TypeScript single-page application. `App.tsx` provides a three-column authenticated shell (sidebar, content, contextual rail), a public auth experience and route composition. Feature screens are grouped by user capability in separate modules. `shared.tsx` contains cross-feature page states and avatar/heading primitives. CSS tokens and responsive rules live in `index.css`; Tailwind CSS v4 is installed through the Vite plugin while the custom visual system remains the source of component styling.

Axios is instantiated once in `api.ts`, with `VITE_API_BASE_URL` as its origin. It attaches the access token and performs one refresh rotation for eligible 401 responses. Refresh requests are shared across concurrent failures. TanStack Query caches feature requests; query keys are feature-oriented. React Router hosts nested authenticated routes. The admin route is hidden unless the access token role is Admin, while API authorization remains authoritative.

## Contract inspection

The Development Swagger endpoint is `https://localhost:7040/swagger/v1/swagger.json`. The live OpenAPI document was inspected during frontend work, alongside the sibling backend repository's checked-in API guide and DTO source.

Implemented API families include `/auth`, `/universities`, `/profiles`, `/discovery/people`, `/connections`, `/communities`, `/feed`, `/posts`, `/events`, `/mentoring`, `/opportunities`, `/notifications`, `/reports`, and admin-only `/moderation` routes. All APIs use the `/api/v1` prefix. DTOs are typed in `src/api.ts` for core feed/profile/community/event/opportunity payloads.

## Confirmed backend gaps and contract differences

- Comments are loaded from the paginated `GET /posts/{id}/comments` route, displayed newest first, and can be created, edited, and deleted by their author.
- Post responses contain `authorName`, author ID, content, audience, community ID, timestamps and counts. They do not contain avatars, university names, current reaction state, bookmark state, community names or comment collections.
- The event create/update DTOs contain title, description, optional community ID (create), UTC start/end, capacity and enum type. They do not contain venue, meeting URL, audience, registration-state boolean, organizer display object or place count. Register/unregister exists.
- Community DTOs contain identity, name, description, university ID, owner ID, visibility, member count and creation time. Community posts/events and invitation-management routes do not exist. Member list returns user IDs only.
- Profiles return university ID but not university display name or journey stage; those fields are in discovery results, not `ProfileResponse`. Profile and cover uploads use the authenticated multipart routes in the updated backend API guide. Feed responses still do not contain author avatars.
- Opportunities support type filters, university scoping and saved listing. Location filter and organisation display name do not exist. Saved state is not included in the general opportunity DTO.
- Notifications have no unread count endpoint. The list has `isRead`; a header badge can’t be authoritative without fetching the list.
- Connection preferences are represented by `allowConnectionRequests` in the profile DTO; there is no separate preferences endpoint.
- Moderation controller requires the `Admin` role; the backend documentation says the `Moderator` role does not qualify.
- The API has no profile journey-stage editing route or explicit settings/account deletion endpoint.
- `GET /profiles/{userId}` identifies profiles by backend user ID; there is no stable public username or slug lookup endpoint. The UI uses name-only profile paths and keeps the slug-to-ID map in browser local storage so links resolve after refresh on that browser. A name-only link opened in a fresh browser cannot resolve another member until their profile is opened through the UI there. A backend-owned unique public slug and lookup endpoint are needed for portable shareable profile links.

No client-generated match score is used; discovery displays the backend `MatchScore`. University choices come from `GET /universities`.

## Security and privacy

The frontend never stores backend secrets or renders user-generated content as HTML. External application links use `target="_blank"` with `rel="noopener noreferrer"`. Session tokens live in tab-scoped `sessionStorage`, which is more exposed to same-origin script than an HttpOnly cookie; the API currently returns tokens in JSON and provides no browser cookie session contract. HTTPS and strict CSP/XSS protections should be used when deploying.

## State, forms, and errors

TanStack Query handles server state and refetching after actions. Feature screens expose loading, retry, empty and API error states. Forms use browser-native controls and request payloads shaped to the backend DTOs. Login validation uses React Hook Form and Zod. Other feature forms currently use semantic browser-native controls with explicit request mapping. Validation on the server is authoritative.

## Responsive and accessibility behavior

- Above 1200px: sidebar, main content and contextual right rail.
- 761–1200px: sidebar and main content; contextual rail hidden.
- 760px and below: single column, off-canvas navigation and five-item bottom navigation.
- Visible keyboard focus, semantic navigation/forms, labels for icon buttons, reduced-motion support, safe external links and accessible status text are included.

Sent connection requests can be withdrawn through the backend `DELETE /connections/requests/{id}` route. The Sent requests list uses **Withdraw request** and reserves **Block** for other relationship contexts.

## Verification scope

Automated behavior coverage has 19 passing tests for login validation/error and protected routing; profile display/edit; discovery filtering; feed display, empty-post validation and bookmarking; connection state/acceptance/withdrawal/removal; post comment loading/creation; event registration; mentor requests; opportunity saving; and admin visibility. Build/typecheck/lint also pass. Browser review covered login at 375px and 1440px; the authenticated shell and API-backed end-to-end flows were not exercised. A formal accessibility audit was not run.

### Enum representation

The current controller configuration uses default System.Text.Json settings (AddControllers() without JsonStringEnumConverter), so enum properties bind/serialize as numbers. This differs from symbolic enum examples in portions of the backend API guide. Frontend requests send numeric values and map numeric responses to readable labels. The live Swagger document was unavailable during implementation, so verify this against its generated schema when the API is running.




