/** Stop in-flight fetches as well as the delay between polls. */
export async function withDeadline<T>(
  timeout: number,
  parent: AbortSignal | undefined,
  reason: Error,
  run: (signal: AbortSignal) => Promise<T>,
) {
  if (!Number.isFinite(timeout) || timeout <= 0)
    throw new RangeError('timeout must be a positive number')
  const controller = new AbortController()
  const cancel = () => controller.abort(parent?.reason)
  if (parent?.aborted) cancel()
  else parent?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => controller.abort(reason), timeout)
  try {
    controller.signal.throwIfAborted()
    return await run(controller.signal)
  } finally {
    clearTimeout(timer)
    parent?.removeEventListener('abort', cancel)
  }
}
export function waitInterval(interval: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, interval)
    signal.addEventListener('abort', abort, { once: true })
  })
}
