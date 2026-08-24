const envDemoFlag = import.meta.env.VITE_ENABLE_DEMO_AUTH

export const DEMO_AUTH_ENABLED = import.meta.env.DEV || envDemoFlag === 'true'
export const DEMO_SESSION_TTL_MS = 8 * 60 * 60 * 1000
