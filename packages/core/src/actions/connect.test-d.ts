import { expectTypeOf, test } from 'vitest'
import {
  type ConnectParameters,
  type ConnectReturnType,
  connect,
} from './connect'

test('connect returns Promise<ConnectReturnType>', () => {
  expectTypeOf(connect).returns.toEqualTypeOf<Promise<ConnectReturnType>>()
})

test('ConnectReturnType has accounts and networkId', () => {
  expectTypeOf<ConnectReturnType>().toHaveProperty('accounts')
  expectTypeOf<ConnectReturnType>().toHaveProperty('networkId')
  expectTypeOf<ConnectReturnType['accounts']>().toEqualTypeOf<
    readonly string[]
  >()
  expectTypeOf<ConnectReturnType['networkId']>().toBeString()
})

test('ConnectParameters has connector field', () => {
  expectTypeOf<ConnectParameters>().toHaveProperty('connector')
})

test('ConnectParameters has optional networkId', () => {
  expectTypeOf<ConnectParameters>().toHaveProperty('networkId')
})
