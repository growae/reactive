import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  FAUCET_PUBLIC_KEY,
  RECIPIENT_PUBLIC_KEY,
  createTestConfig,
} from './integration'

const nodeConfig = readFileSync(
  fileURLToPath(new URL('../config/aeternity.yaml', import.meta.url)),
  'utf8',
)

// Runs without a node so the normal Test job catches a broken fixture. The
// integration suite skips itself unless INTEGRATION is set, which previously
// let an unusable faucet key sit in the repo undetected.
describe('integration fixture', () => {
  it('derives the faucet address from the faucet secret key', async () => {
    const config = createTestConfig()
    const connector = config.connectors[0]!

    const { accounts } = await connector.connect({ networkId: 'ae_devnet' })

    expect(accounts).toEqual([FAUCET_PUBLIC_KEY])
  })

  it('pre-funds the faucet in the devnet genesis accounts', () => {
    const genesis = nodeConfig.match(
      /genesis_accounts:\n((?:\s{4}\S.*\n)+)/,
    )?.[1]

    expect(genesis).toBeDefined()
    expect(genesis).toContain(FAUCET_PUBLIC_KEY)
  })

  it('spends to an address that is not the faucet', () => {
    expect(RECIPIENT_PUBLIC_KEY).not.toBe(FAUCET_PUBLIC_KEY)
  })
})
