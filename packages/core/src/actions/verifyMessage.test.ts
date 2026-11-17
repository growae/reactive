import { expect, it } from 'vitest'
import { createConfig } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { testnet } from '../types/network.js'
import { verifyMessage } from './verifyMessage.js'

it('verifies raw signature bytes and returns false for malformed hexadecimal input', async () => {
  const config = createConfig({ networks: [testnet] })
  const { keys, encoding } = await loadProtocol()
  const [key, address] = keys.fromSeed(new Uint8Array(32).fill(1))
  const signature = encoding.decode(keys.signMessage(key, 'hello'))
  await expect(
    verifyMessage(config, { address, signature, message: 'hello' }),
  ).resolves.toBe(true)
  await expect(
    verifyMessage(config, { address, signature: 'xz', message: 'hello' }),
  ).resolves.toBe(false)
})
