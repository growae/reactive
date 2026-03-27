import { expectTypeOf, test } from 'vitest'
import {
  openChannel,
  type OpenChannelParameters,
  type OpenChannelReturnType,
} from './openChannel.js'
import type { Config } from '../../createConfig.js'

test('openChannel returns Promise<OpenChannelReturnType>', () => {
  expectTypeOf(openChannel).returns.toEqualTypeOf<Promise<OpenChannelReturnType>>()
})

test('OpenChannelReturnType has channelId', () => {
  expectTypeOf<OpenChannelReturnType>().toHaveProperty('channelId')
  expectTypeOf<OpenChannelReturnType['channelId']>().toBeString()
})

test('OpenChannelParameters has url', () => {
  expectTypeOf<OpenChannelParameters>().toHaveProperty('url')
  expectTypeOf<OpenChannelParameters['url']>().toBeString()
})

test('OpenChannelParameters has role', () => {
  expectTypeOf<OpenChannelParameters>().toHaveProperty('role')
  expectTypeOf<OpenChannelParameters['role']>().toEqualTypeOf<'initiator' | 'responder'>()
})

test('OpenChannelParameters has initiatorId and responderId', () => {
  expectTypeOf<OpenChannelParameters>().toHaveProperty('initiatorId')
  expectTypeOf<OpenChannelParameters>().toHaveProperty('responderId')
})

test('OpenChannelParameters has sign function', () => {
  expectTypeOf<OpenChannelParameters>().toHaveProperty('sign')
  expectTypeOf<OpenChannelParameters['sign']>().toBeFunction()
})
