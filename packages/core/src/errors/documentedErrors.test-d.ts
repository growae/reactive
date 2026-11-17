import {
  BaseError,
  type Config,
  getBalance,
  NodeRequestError,
} from '@growae/reactive'
import { expectTypeOf, test } from 'vitest'

declare const config: Config
test('node and wallet errors narrow to their public types', async () => {
  try {
    await getBalance(config, { address: 'ak_example' })
  } catch (error) {
    if (error instanceof NodeRequestError)
      expectTypeOf(error.statusCode).toEqualTypeOf<number>()
    else if (error instanceof BaseError)
      expectTypeOf(error.shortMessage).toEqualTypeOf<string>()
    else throw error
  }
})
