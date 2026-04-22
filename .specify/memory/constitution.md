<!--
Sync Impact Report
==================
Version change: N/A (initial) → 1.0.0
Modified principles: N/A (first ratification)
Added sections:
  - Core Principles (6 principles)
  - Technology Stack Constraints
  - Development Workflow & Naming Conventions
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no changes needed (Constitution Check section already references constitution file)
  - .specify/templates/spec-template.md — ✅ no changes needed (requirements structure compatible)
  - .specify/templates/tasks-template.md — ✅ no changes needed (phase structure compatible)
  - .specify/templates/commands/*.md — ⚠ no command files found in directory
Follow-up TODOs: None
-->

# Telemed Tracking คปสอ.สอง Constitution

## Core Principles

### I. GAS CORS Communication Compliance (NON-NEGOTIABLE)

All HTTP requests to the Google Apps Script backend MUST adhere to the
Simple Request pattern to avoid CORS preflight failures. This is a hard
constraint of the GAS Web App deployment model.

- **GET requests**: Token and all parameters MUST be sent as query string
  parameters. No custom headers are permitted.
- **POST requests**: Token MUST reside in the JSON body. The request body
  is a JSON string sent with the default `text/plain` Content-Type. The
  `Content-Type: application/json` header MUST NOT be set. No custom
  headers (e.g., `Authorization`, `X-Session-Token`) are permitted.
- Every GAS call MUST route through `services/api.ts` (`gasGet` / `gasPost`).
  Components and modules MUST NEVER call `fetch()` directly against the GAS
  endpoint.
- Session tokens MUST be stored exclusively in `sessionStorage` — never in
  `localStorage`, cookies, or in-memory state that persists across reloads.

**Rationale**: GAS does not handle HTTP OPTIONS preflight requests. Any
request that triggers a preflight (via `Content-Type: application/json` or
custom headers) will fail silently or with a CORS error. Violations are
not recoverable at runtime — they require code changes and redeployment.

### II. Strict TypeScript Discipline

TypeScript strict mode (`"strict": true` in tsconfig) is mandatory for the
entire project.

- The `any` type is forbidden except when demonstrably unavoidable, and
  every such usage MUST include an inline comment explaining why.
- Every GAS response MUST be validated with a Zod schema before consumption
  by application code. Raw `gasGet`/`gasPost` return types are `unknown`;
  callers are responsible for parsing.
- All interfaces and type definitions MUST reside in `src/types/`,
  organized by domain (e.g., `hospital.ts`, `visit.ts`, `drug.ts`).
- Shared types between frontend and GAS backend (action names, response
  shapes) MUST be documented and kept in sync manually since no shared
  package exists.

**Rationale**: The GAS backend is untyped JavaScript. Without Zod validation
at the boundary, malformed data silently propagates into the React state,
causing hard-to-diagnose runtime errors. Strict typing catches these at
development time.

### III. UI/UX Design System Adherence (NON-NEGOTIABLE)

All visual presentation MUST conform to the design system defined in
`DESIGN.md`. The approved component and styling framework is **shadcn/ui +
Tailwind CSS utility classes**.

- Custom CSS files (`.css`, `.scss`, `.less`) MUST NOT be created unless
  explicitly approved for an unavoidable edge case (e.g., third-party
  library integration). All styling MUST use Tailwind utility classes.
- Components in `src/components/ui/` are managed exclusively via the
  `shadcn` CLI. Direct edits to these files are forbidden.
- Color tokens, typography scale, spacing units, border-radius values,
  and elevation patterns MUST follow the specifications in `DESIGN.md`.
- The only chromatic accent is Apple Blue (`#0071e3`), reserved for
  interactive elements. No additional accent colors are permitted.
- Section backgrounds MUST alternate between pure black (`#000000`) and
  light gray (`#f5f5f7`) as described in `DESIGN.md`.
- Typography MUST use SF Pro Display at 20px+ and SF Pro Text below 20px
  with negative letter-spacing at all sizes.

**Rationale**: The project serves government healthcare staff across 16
facilities. Visual consistency reduces training overhead and prevents UI
regression across modules maintained by different contributors.

### IV. Data Integrity & Soft-Delete Policy

Data deletion in the system is always logical, never physical.

- **Equipment (Module 1)**: Deactivation sets `status = inactive`. Row
  deletion is forbidden.
- **Master Drugs**: Deactivation sets `active = N`. Row deletion is
  forbidden. If a drug name is referenced in `VISIT_MEDS`, the `drug_name`
  value in `MASTER_DRUGS` MUST NOT be changed — it acts as a natural
  foreign key.
- **VN (Visit Number)**: The system MUST NEVER generate VN values.
  VN always originates from HosXP. It serves as the primary key for
  `VISIT_SUMMARY` and `VISIT_MEDS`.
- **actual_count (Module 3)**: This value is NOT stored in
  `CLINIC_SCHEDULE`. It is computed in real-time by GAS as the count of
  `VISIT_SUMMARY` rows matching `service_date + hosp_code + clinic_type`
  where `attended = Y`.

**Rationale**: Google Sheets is append-oriented with no transaction
support. Physical deletion risks data loss with no rollback. Soft-delete
preserves audit trails and referential integrity without adding complexity.

### V. Role-Based Access Control & Data Security

Access control is enforced at two layers: Frontend (UI visibility) and
GAS backend (query filtering). Neither layer alone is sufficient.

- `staff_hsc` users MUST only see and modify data for their own `hosp_code`.
  Every GAS action MUST filter by the authenticated user's `hosp_code`.
- `staff_hosp` and above may see data for all facilities.
- `super_admin` is the only role permitted to view Audit Logs and modify
  system Settings.
- Patient-sensitive fields (`tel`, `hn`) MUST only appear in Module 6
  (admin_hosp and above). The GAS `visitMeds.list` action MUST exclude
  these fields from the response.
- The public Dashboard MUST NOT display any patient-identifiable data.
  GAS MUST strip sensitive fields before responding to unauthenticated
  requests.

**Rationale**: Healthcare data carries legal obligations under Thai
personal data protection regulations. Dual-layer enforcement prevents
data leakage even if one layer has a bug.

### VI. Service Layer Architecture

Application code MUST follow a strict layering: Component → Service → API.

- React components MUST call service functions (e.g.,
  `visitService.ts`, `drugService.ts`), never `gasGet`/`gasPost` directly.
- Service functions encapsulate action names, parameter mapping, and
  response parsing with Zod validation.
- GAS action names follow the `module.verb` convention (e.g.,
  `visitMeds.list`, `equipment.save`).
- Zustand stores manage client-side state only (auth session, UI state).
  They MUST NOT contain business logic or make API calls directly.

**Rationale**: A service layer isolates components from GAS communication
details, enables consistent error handling, and makes the codebase
testable without mocking fetch at the component level.

## Technology Stack Constraints

The following technology choices are ratified and MUST NOT be changed
without explicit approval:

| Layer | Technology | Version Constraint |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Build Tool | Vite | 8.x |
| Language | TypeScript | 5.x (strict) |
| Framework | React | 19.x |
| Routing | React Router | 7.x |
| UI Library | shadcn/ui + Tailwind CSS | 4.x |
| Icons | Lucide React | Latest stable |
| Global State | Zustand | 5.x |
| Async State | TanStack Query | 5.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Excel Parser | SheetJS (xlsx) | 0.18.x |
| Date Utilities | date-fns | 4.x |
| Backend | Google Apps Script | V8 Runtime |
| Database | Google Sheets | — |
| Notifications | Telegram Bot API | — |
| Hosting | Cloudflare Pages | — |

Adding a new dependency outside this list requires a constitution
amendment or explicit project-lead approval documented in the commit.

## Development Workflow & Naming Conventions

### Naming Rules

| Artifact | Convention | Example |
|---|---|---|
| React Components | PascalCase | `VisitMedsTable.tsx` |
| Custom Hooks | camelCase, `use` prefix | `useVisitMeds.ts` |
| Service Files | camelCase, `Service` suffix | `visitService.ts` |
| Store Files | camelCase, `Store` suffix | `authStore.ts` |
| Constants | SCREAMING_SNAKE_CASE | `CLINIC_TYPES` |
| Types / Interfaces | PascalCase | `VisitSummary` |
| GAS Actions | `module.verb` | `visitMeds.list` |

### Environment Variables

All environment variables use the `VITE_` prefix and are defined in
`.env.local` (never committed):

| Variable | Purpose |
|---|---|
| `VITE_GAS_API_URL` | GAS Web App endpoint URL |
| `VITE_APP_URL` | Public app URL (for Telegram links) |
| `VITE_APP_NAME` | Application display name |
| `VITE_DASHBOARD_PATH` | Public dashboard route |

### Spec-Driven Development

This project follows the Spec Kit workflow:

1. **Constitution** (this file): Supremacy rules and constraints.
2. **Specification** (`spec.md`): Feature requirements from business context.
3. **Planning** (`plan.md`): Architecture and state management design.
4. **Tasks** (`tasks.md`): Ordered implementation checklist.
5. **Execution**: AI agent reads artifacts and implements.

## Governance

This constitution is the authoritative source for non-negotiable project
rules. In the event of conflict between this document and any other
artifact (spec, plan, task, or code comment), this constitution prevails.

### Amendment Procedure

1. Proposed changes MUST be documented with rationale.
2. Version MUST be bumped: MAJOR for principle removal/redefinition,
   MINOR for new principles or materially expanded guidance, PATCH for
   clarifications and wording fixes.
3. All dependent templates (plan, spec, tasks) MUST be reviewed for
   consistency after any amendment.
4. The `LAST_AMENDED_DATE` MUST be updated to the amendment date.

### Compliance Review

- Every feature spec MUST include a "Constitution Check" section verifying
  alignment with all six principles.
- Code reviews MUST flag any violation of GAS CORS patterns, TypeScript
  strictness, design system adherence, or soft-delete policy.
- Complexity introduced without necessity (e.g., extra state management
  libraries, custom CSS files) MUST be justified in the plan's
  Complexity Tracking table.

### Runtime Guidance

For day-to-day development guidance, refer to `CLAUDE.md` (project-level)
and the global `~/.claude/CLAUDE.md` for tooling and workflow preferences.
Those files extend this constitution but MUST NOT contradict it.

**Version**: 1.0.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-22
