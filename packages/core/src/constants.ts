/**
 * Default transaction TTL (Time-To-Live) in blocks relative to current height.
 * At ~3 minutes per key block, 300 blocks ≈ 15 hours.
 * Override per-transaction with `ttl: 0` (no expiration) or any custom value.
 */
export const DEFAULT_TTL = 300

/**
 * Default AENS name TTL in blocks (~375 days at max).
 */
export const DEFAULT_NAME_TTL = 180000

/**
 * Default AENS client TTL in seconds (1 hour).
 */
export const DEFAULT_CLIENT_TTL = 3600

/**
 * Default oracle TTL value in blocks.
 */
export const DEFAULT_ORACLE_TTL_VALUE = 500

/**
 * Default oracle query TTL value in blocks.
 */
export const DEFAULT_QUERY_TTL_VALUE = 10

/**
 * Default oracle response TTL value in blocks.
 */
export const DEFAULT_RESPONSE_TTL_VALUE = 10
