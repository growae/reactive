export type DetectedWallet = {
  id: string
  name: string
  networkId: string
  type: string
  origin: string
}

export type WalletDetectResult = {
  wallets: Map<string, DetectedWallet>
  stop: () => void
}

/**
 * Scan for available Aeternity wallets (Superhero extension, iframe wallets, …).
 *
 * Returns an async iterable that yields newly-detected wallets and a `stop`
 * function to end the scan. Under the hood this wraps the `walletDetector`
 * utility from `@aeternity/aepp-sdk`.
 *
 * @param options.debug - Enable debug logging on the scanner connection.
 * @param options.timeout - Auto-stop scanning after this many milliseconds.
 */
export async function walletDetect(
  options: {
    debug?: boolean | undefined
    timeout?: number | undefined
    onDetected?: (wallet: DetectedWallet) => void
  } = {},
): Promise<WalletDetectResult> {
  const { walletDetector, BrowserWindowMessageConnection } = await import(
    '@aeternity/aepp-sdk'
  )

  const connection = new BrowserWindowMessageConnection({
    debug: options.debug,
  })

  const wallets = new Map<string, DetectedWallet>()

  const stopScan = walletDetector(
    connection,
    ({ newWallet }: { newWallet: { info: DetectedWallet } }) => {
      const wallet: DetectedWallet = {
        id: newWallet.info.id,
        name: newWallet.info.name,
        networkId: newWallet.info.networkId,
        type: newWallet.info.type,
        origin: newWallet.info.origin,
      }
      wallets.set(wallet.id, wallet)
      options.onDetected?.(wallet)
    },
  )

  let timer: ReturnType<typeof setTimeout> | undefined
  const stop = () => {
    if (timer) clearTimeout(timer)
    stopScan()
  }

  if (options.timeout != null && options.timeout > 0) {
    timer = setTimeout(stop, options.timeout)
  }

  return { wallets, stop }
}
