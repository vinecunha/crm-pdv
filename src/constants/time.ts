// Named time constants (replaces magic numbers throughout codebase)
export const ONE_MINUTE_MS = 60 * 1000
export const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS
export const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS
export const THIRY_MINUTES_MS = 30 * ONE_MINUTE_MS
export const SIXTY_MINUTES_MS = 60 * ONE_MINUTE_MS

// Polling intervals (converted to Realtime where possible)
export const GOAL_CHECK_INTERVAL_MS = THIRY_MINUTES_MS // Now uses Realtime
export const BIRTHDAY_CHECK_INTERVAL_MS = SIXTY_MINUTES_MS // Now uses Realtime  
export const STOCK_CHECK_INTERVAL_MS = THIRY_MINUTES_MS // Now uses Realtime

// Session management
export const SESSION_CHECK_INTERVAL_MS = THIRY_MINUTES_MS

// Cache/Sync
export const PERSIST_THROTTLE_MS = FIVE_MINUTES_MS
export const STALE_TIME_MS = FIVE_MINUTES_MS
export const GC_TIME_MS = 30 * ONE_MINUTE_MS

// Time-based theme
export const SUNRISE_HOUR = 6
export const SUNSET_HOUR = 18
export const THEME_CHECK_INTERVAL_MS = ONE_MINUTE_MS
