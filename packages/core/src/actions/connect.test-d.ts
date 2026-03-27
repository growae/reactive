import { expectTypeOf, test } from 'vitest'
import {
  connect,
  type ConnectParameters,
  type ConnectReturnType,
} from './connect.js'
import type { Config } from '../createConfig.js'

test('connect returns Promise<ConnectReturnType>', () => {
  expectTypeOf(connect).returns.toEqualTypeOf<Promise<ConnectReturnType>>()
})

test('ConnectReturnType has accounts and networkId', () => {
  expectTypeOf<ConnectReturnType>().toHaveProperty('accounts')
  expectTypeOf<ConnectReturnType>().toHaveProperty('networkId')
  expectTypeOf<ConnectReturnType['accounts']>().toEqualTypeOf<readonly string[]>()
  expectTypeOf<ConnectReturnType['networkId']>().toBeString()
})

test('ConnectParameters has connector field', () => {
  expectTypeOf<ConnectParameters>().toHaveProperty('connector')
})

test('ConnectParameters has optional networkId', () => {
  expectTypeOf<ConnectParameters>().toHaveProperty('networkId')
})
