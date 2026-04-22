# Research — Telemed Tracking คปสอ.สอง

## R1: Password Hashing in Google Apps Script

**Decision**: Iterated HMAC-SHA256 (10,000 iterations) with per-user random salt

**Rationale**:
- GAS V8 does not natively support bcrypt, scrypt, or Argon2
- `Utilities.computeHmacSha256Signature()` is available and cryptographically stronger than plain digest
- 10,000 iterations makes brute-force impractical while completing in <1 second on GAS
- Per-user random salt prevents rainbow table attacks
- For ~50 users in a government healthcare system, this is proportionate security
- GAS execution limit is 6 minutes — 10K HMAC iterations complete in ~0.5s

**Alternatives Considered**:
- **bcrypt via JS library**: No reliable GAS implementation. Blowfish in pure GAS is too slow.
- **Plain SHA-256 + salt (single iteration)**: Vulnerable to GPU-accelerated attacks (RTX 4090 computes ~2.5B SHA-256/s). Rejected.
- **External hashing service via UrlFetchApp**: Sends passwords to third party. Security risk rejected.

**Implementation**:
```javascript
var HASH_ITERATIONS = 10000;

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 32);
}

function hashPassword(password, salt) {
  var hash = Utilities.computeHmacSha256Signature(password, salt);
  var hex = bytesToHex(hash);
  for (var i = 1; i < HASH_ITERATIONS; i++) {
    hash = Utilities.computeHmacSha256Signature(hex + password, salt);
    hex = bytesToHex(hash);
  }
  return hex;
}

function verifyPassword(password, salt, storedHash) {
  return hashPassword(password, salt) === storedHash;
}

function bytesToHex(bytes) {
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}
```

**Schema Note**: USERS sheet needs a `password_salt` column (separate from `password_hash`).

---

## R2: Testing Strategy

**Decision**: Vitest + React Testing Library v16 + service-layer mocking (`vi.mock`)

**Rationale**:
- **Vitest**: Native Vite integration, shares config, ESM-first, faster than Jest. Official recommendation from Vite ecosystem.
- **React Testing Library v16+**: Official React 19 support. Tests user behavior, not implementation. `user-event` for realistic React Hook Form interactions.
- **Service-layer mocking**: Mock at `*Service.ts` level with `vi.mock()`, NOT with MSW. The GAS fetch pattern (single endpoint, text/plain body, token in query/body) is non-standard and makes MSW handlers verbose. Service layer is the natural test seam since every component already goes through services.
- No backend tests — GAS is untyped JavaScript deployed separately. Manual testing against real Sheets.

**Why NOT MSW**:
1. GAS uses a non-standard fetch pattern (single endpoint, action-based routing, text/plain body)
2. The HTTP request construction is centralized in exactly 2 functions (`gasGet`/`gasPost`) — testing those once is sufficient
3. MSW gives false confidence — tests that your mock matches your assumption about GAS, not that GAS works that way
4. Service-layer mocks are simpler, faster, and more focused

**Implementation Scope (Risk-Driven 3-Tier)**:
- **Tier 1 — Must Have**: Zod schemas, utilities (dateUtils, roleGuard, excelParser), service functions, authStore, RoleGuard
- **Tier 2 — Should Have**: Form validation (RHF + Zod), TanStack Query hooks, component rendering
- **Tier 3 — Nice to Have**: Full page rendering with mocked data (manual testing acceptable)

**Dev Dependencies**:
```json
{
  "vitest": "^3.1.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.6.0",
  "@testing-library/user-event": "^14.5.0",
  "jsdom": "^25.0.0",
  "@vitest/coverage-v8": "^3.1.0"
}
```

**Setup**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false
  }
})
```

---

## R3: SF Pro Font Licensing & Web Usage

**Decision**: Use system font stack with `-apple-system` as primary; SF Pro only available on Apple devices natively

**Rationale**:
- SF Pro is **not licensed for web use** outside Apple's platforms. It cannot be self-hosted or embedded in a web application.
- However, `-apple-system, BlinkMacSystemFont` resolves to SF Pro on macOS/iOS Safari and Chrome automatically.
- On Windows, falls back to Segoe UI. On Android, Roboto. On Linux, Helvetica Neue/Arial.
- This achieves the Apple aesthetic on Apple devices while providing a clean fallback elsewhere.
- The tight letter-spacing and SF Pro optical sizing defined in DESIGN.md will apply on Apple devices via the system fallback.

**Alternatives Considered**:
- **Self-host SF Pro WOFF2**: Violates Apple's license. Rejected.
- **Inter font**: Very similar to SF Pro and designed as a free alternative. Good option if a consistent cross-platform look is needed later. Not needed now.
- **Pretendard**: Korean/Chinese font inspired by Apple's system font. Not relevant for Thai/English UI.

**Implementation**:
```css
/* In Tailwind config — fontFamily setting */
fontFamily: {
  sans: [
    '-apple-system', 'BlinkMacSystemFont',
    'SF Pro Display', 'SF Pro Text',
    'Segoe UI', 'Roboto',
    'Helvetica Neue', 'Noto Sans', 'Noto Sans Thai', 'Sarabun',
    'Arial', 'sans-serif'
  ]
}
```

**Important**: SF Pro does NOT include Thai glyphs. When Thai text is rendered, the browser falls back to Thai system fonts (Sarabun on Windows, Noto Sans Thai on Android). The Thai font fallbacks (`Noto Sans Thai`, `Sarabun`) ensure proper Thai text rendering across all platforms. The typography rules from DESIGN.md (SF Pro Display 20px+, SF Pro Text below) apply to English text; Thai text uses the platform's default Thai rendering.

---

## R4: GAS Deployment Workflow

**Decision**: Manual copy-paste to GAS editor (no clasp)

**Rationale**:
- The GAS backend is a single file (`backend/Code.gs`). clasp adds unnecessary complexity for a one-file deployment.
- The GAS editor provides built-in versioning, deployment management, and log viewing.
- clasp requires additional setup (Node.js clasp CLI, .clasp.json config, auth flow) for minimal benefit.

**Alternatives Considered**:
- **clasp**: Adds git-like push/pull for GAS. Useful for multi-file GAS projects, overkill for Code.gs.
- **GitHub Actions → GAS deploy**: No official GAS deploy API. Would need clasp in CI. Complex.

**Implementation**:
1. Develop Code.gs locally in `backend/Code.gs`
2. Copy-paste into GAS editor when ready to deploy
3. Deploy → New deployment → Web app → Anyone can access
4. Copy Web App URL → update `VITE_GAS_API_URL` in `.env.local`

---

## R5: SheetJS Excel Parsing Strategy

**Decision**: Client-side parsing with SheetJS, server-side validation via GAS

**Rationale**:
- SheetJS runs entirely in the browser — no file upload needed for preview
- The frontend parses the Excel file, groups rows by VN, shows preview with inline editing
- When user confirms, the parsed JSON is sent to GAS `import.confirm` action
- GAS performs server-side validation (VN uniqueness, drug_name existence) as a safety net
- This split approach gives instant user feedback while maintaining data integrity

**Implementation Flow**:
1. User selects file → SheetJS reads ArrayBuffer in browser
2. `excelParser.ts` validates column headers, groups by VN
3. Frontend shows preview with edit capability
4. On confirm → `import.preview` GAS action for server validation
5. If preview passes → `import.confirm` GAS action to write data

---

## R6: Date Handling (พ.ศ. / ค.ศ.)

**Decision**: Store as ISO 8601 (Gregorian/ค.ศ.) in Sheets, display as พ.ศ. on frontend

**Rationale**:
- Google Sheets and GAS natively work with Gregorian dates
- Excel imports from HosXP use พ.ศ. (Buddhist Era) — must convert during parsing
- Conversion: `พ.ศ. year - 543 = ค.ศ. year` (e.g., 2569 → 2026)
- Display: `dateUtils.ts` formats stored ค.ศ. dates as พ.ศ. using date-fns

**Implementation**:
```typescript
// utils/dateUtils.ts
import { format, parse } from 'date-fns'

// Convert พ.ศ. Excel date to ISO ค.ศ.
export function buddhistToISO(dateStr: string): string {
  // Input: DD/MM/YYYY (พ.ศ.)
  const parsed = parse(dateStr, 'dd/MM/yyyy', new Date())
  const year = parsed.getFullYear() - 543
  parsed.setFullYear(year)
  return format(parsed, 'yyyy-MM-dd')
}

// Format ISO date for display as พ.ศ.
export function formatBuddhist(isoDate: string): string {
  const date = new Date(isoDate)
  const buddhistYear = date.getFullYear() + 543
  return `${date.getDate()}/${date.getMonth() + 1}/${buddhistYear}`
}
```
