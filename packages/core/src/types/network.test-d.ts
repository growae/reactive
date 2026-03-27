import { expectTypeOf, test } from 'vitest'
import { type Network, mainnet, testnet } from './network.js'

test('mainnet is of type Network', () => {
  expectTypeOf(mainnet).toMatchTypeOf<Network>()
})

test('testnet is of type Network', () => {
  expectTypeOf(testnet).toMatchTypeOf<Network>()
})

test('Network has id property', () => {
  expectTypeOf<Network>().toHaveProperty('id')
  expectTypeOf<Network['id']>().toBeString()
})

test('Network has name property', () => {
  expectTypeOf<Network>().toHaveProperty('name')
  expectTypeOf<Network['name']>().toBeString()
})

test('Network has nodeUrl property', () => {
  expectTypeOf<Network>().toHaveProperty('nodeUrl')
  expectTypeOf<Network['nodeUrl']>().toBeString()
})

test('Network has optional compilerUrl', () => {
  expectTypeOf<Network['compilerUrl']>().toEqualTypeOf<string | undefined>()
})

test('Network has optional middlewareUrl', () => {
  expectTypeOf<Network['middlewareUrl']>().toEqualTypeOf<string | undefined>()
})
