import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared validation constants & schemas
//
// Single source of truth for fixed-format identifiers (HN, VN).
// Reuse across services (Zod) and parsers (imperative regex tests) so that
// format changes only need to be made here.
// ---------------------------------------------------------------------------

/** HN (Hospital Number) — exactly 9 digits */
export const HN_LENGTH = 9
export const HN_REGEX = /^\d{9}$/
export const HN_ERROR_MESSAGE = 'HN ต้องเป็นตัวเลข 9 หลัก'

/** VN (Visit Number) — exactly 12 digits (YYMMDDHHmmSS) */
export const VN_LENGTH = 12
export const VN_REGEX = /^\d{12}$/
export const VN_ERROR_MESSAGE = 'VN ต้องเป็นตัวเลข 12 หลัก (YYMMDDHHmmSS)'

/** Reusable Zod schema for HN field */
export const hnSchema = z.string().regex(HN_REGEX, HN_ERROR_MESSAGE)

/** Reusable Zod schema for VN field */
export const vnSchema = z.string().regex(VN_REGEX, VN_ERROR_MESSAGE)
