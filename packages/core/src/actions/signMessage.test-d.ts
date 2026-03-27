import { expectTypeOf, test } from 'vitest'
import {
  type SignMessageParameters,
  type SignMessageReturnType,
  signMessage,
} from './signMessage'

test('signMessage returns Promise<SignMessageReturnType>', () => {
  expectTypeOf(signMessage).returns.toEqualTypeOf<
    Promise<SignMessageReturnType>
  >()
})

test('SignMessageParameters has message field', () => {
  expectTypeOf<SignMessageParameters>().toHaveProperty('message')
  expectTypeOf<SignMessageParameters['message']>().toBeString()
})

test('SignMessageReturnType has signature field', () => {
  expectTypeOf<SignMessageReturnType>().toHaveProperty('signature')
  expectTypeOf<SignMessageReturnType['signature']>().toBeString()
})

test('SignMessageParameters has optional onAccount', () => {
  expectTypeOf<SignMessageParameters>().toHaveProperty('onAccount')
})
