/**
 * Default transaction TTL (Time-To-Live) in blocks relative to current height.
 * At ~3 minutes per key block, 300 blocks ≈ 15 hours.
 * Override per-transaction with `ttl: 0` (no expiration) or any custom value.
 */
export const DEFAULT_TTL = 300

/**
 * Default upper bound, in milliseconds, on how long an action waits for its
 * transaction to be mined. `waitForTransaction` polls until the transaction
 * leaves the mempool and stops only on this timeout when the transaction
 * carries a non-zero TTL, so an action that waits by default needs a bound
 * that is comfortably past a handful of key blocks without approaching
 * `DEFAULT_TTL`'s ~15 hours. 20 minutes.
 */
export const DEFAULT_WAIT_TIMEOUT = 20 * 60 * 1000

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
