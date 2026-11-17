import { expectTypeOf, test } from 'vitest'
import { type Config, createConfig, type State } from './createConfig.js'
import type { NodeClient } from './node.js'
import { mainnet, testnet } from './types/network.js'

test('createConfig returns Config', () => {
  const config = createConfig({
    networks: [mainnet, testnet],
  })
  expectTypeOf(config).toMatchTypeOf<Config>()
})

test('Config has state property', () => {
  expectTypeOf<Config['state']>().toMatchTypeOf<State>()
})

test('State has expected properties', () => {
  expectTypeOf<State>().toHaveProperty('networkId')
  expectTypeOf<State>().toHaveProperty('connections')
  expectTypeOf<State>().toHaveProperty('current')
  expectTypeOf<State>().toHaveProperty('status')
})

test('State.status is a union of connection states', () => {
  expectTypeOf<State['status']>().toEqualTypeOf<
    'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  >()
})

test('Config has getNodeClient method', () => {
  expectTypeOf<Config['getNodeClient']>().toBeFunction()
  expectTypeOf<
    ReturnType<Config['getNodeClient']>
  >().toEqualTypeOf<NodeClient>()
})

test('Config has subscribe method', () => {
  expectTypeOf<Config['subscribe']>().toBeFunction()
})
