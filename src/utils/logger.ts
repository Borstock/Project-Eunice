/**
 * logger.ts – thin debug logger controlled by VITE_ENABLE_DEBUG.
 *
 * Usage:
 *   import { logger } from '@/utils/logger'
 *   logger.debug('habitStore', 'loaded habits', habits)
 *   logger.warn('storage', 'key not found', key)
 */
import { ENABLE_DEBUG } from '@/config/env'

type LogLevel = 'debug' | 'warn' | 'error'

function log(level: LogLevel, namespace: string, message: string, ...args: unknown[]): void {
  if (!ENABLE_DEBUG && level === 'debug') return

  const prefix = `[${namespace}]`
  if (level === 'error') {
    console.error(prefix, message, ...args)
  } else if (level === 'warn') {
    console.warn(prefix, message, ...args)
  } else {
    console.debug(prefix, message, ...args)
  }
}

export const logger = {
  debug: (namespace: string, message: string, ...args: unknown[]) =>
    log('debug', namespace, message, ...args),
  warn: (namespace: string, message: string, ...args: unknown[]) =>
    log('warn', namespace, message, ...args),
  error: (namespace: string, message: string, ...args: unknown[]) =>
    log('error', namespace, message, ...args)
}
