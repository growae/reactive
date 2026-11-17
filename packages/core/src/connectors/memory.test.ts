import { expect, it } from 'vitest'
import { connect } from '../actions/connect.js'
import { disconnect } from '../actions/disconnect.js'
import { signMessage } from '../actions/signMessage.js'
import { verifyMessage } from '../actions/verifyMessage.js'
import { createConfig } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import { mainnet, testnet } from '../types/network.js'
import { memory } from './memory.js'

it('connects, signs a framed message, verifies it and disconnects', async () => {
  const { keys } = await loadProtocol()
  const [secretKey, address] = keys.fromSeed(new Uint8Array(32).fill(7))
  const config = createConfig({
    networks: [testnet],
    connectors: [memory({ accounts: [{ secretKey }] })],
    storage: null,
  })
  const connector = config.connectors[0]!
  await expect(connect(config, { connector })).resolves.toMatchObject({
    accounts: [address],
  })
  const { signature } = await signMessage(config, { message: 'hello' })
  await expect(
    verifyMessage(config, { message: 'hello', address, signature }),
  ).resolves.toBe(true)
  await expect(
    verifyMessage(config, { message: 'changed', address, signature }),
  ).resolves.toBe(false)
  await expect(connector.getProvider!()).resolves.toEqual({ address })
  await disconnect(config)
  await expect(connector.getAccounts()).rejects.toThrow()
})

it('rejects malformed keys before connecting', async () => {
  const config = createConfig({
    networks: [testnet],
    connectors: [memory({ accounts: [{ secretKey: 'invalid' }] })],
    storage: null,
  })
  await expect(
    connect(config, { connector: config.connectors[0]! }),
  ).rejects.toThrow()
  expect(config.state.connections.size).toBe(0)
})

it('reports the network chosen at connect and after a switch', async () => {
  const { keys } = await loadProtocol()
  const [secretKey] = keys.fromSeed(new Uint8Array(32).fill(3))
  const config = createConfig({
    networks: [mainnet, testnet],
    connectors: [memory({ accounts: [{ secretKey }] })],
    storage: null,
  })
  const connector = config.connectors[0]!
  await connect(config, { connector, networkId: testnet.id })
  expect(await connector.getNetworkId()).toBe(testnet.id)
  await connector.switchNetwork!({ networkId: mainnet.id })
  expect(await connector.getNetworkId()).toBe(mainnet.id)
})
