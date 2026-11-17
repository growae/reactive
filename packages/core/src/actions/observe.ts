/** Poll serially. An unsubscribe during an in-flight request suppresses its delivery. */
export function observe<T>(
  read: () => Promise<T>,
  deliver: (value: T) => void,
  interval: number,
  onError?: ((error: Error) => void) | undefined,
) {
  if (!Number.isFinite(interval) || interval <= 0)
    throw new RangeError('Polling interval must be positive')
  let active = true
  let timer: ReturnType<typeof setTimeout> | undefined
  async function poll() {
    try {
      const value = await read()
      if (active) deliver(value)
    } catch (error) {
      if (active)
        onError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      if (active) timer = setTimeout(poll, interval)
    }
  }
  void poll()
  return () => {
    active = false
    clearTimeout(timer)
  }
}
