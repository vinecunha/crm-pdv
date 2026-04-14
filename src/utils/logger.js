import { logger } from '../utils/logger'
const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => isDev && logger.log(...args),
  info: (...args) => isDev && console.info(...args),
  warn: (...args) => isDev && console.warn(...args),
  error: (...args) => console.error(...args), // Erros sempre logados
  debug: (...args) => isDev && console.debug(...args)
}