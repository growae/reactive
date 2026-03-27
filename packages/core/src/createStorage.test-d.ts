import { expectTypeOf, test } from 'vitest'
import { type Storage, createStorage } from './createStorage.js'

test('createStorage returns Storage', () => {
  const storage = createStorage({ storage: undefined })
  expectTypeOf(storage).toMatchTypeOf<Storage>()
})

test('Storage has getItem method', () => {
  expectTypeOf<Storage>().toHaveProperty('getItem')
  expectTypeOf<Storage['getItem']>().toBeFunction()
})

test('Storage has setItem method', () => {
  expectTypeOf<Storage>().toHaveProperty('setItem')
  expectTypeOf<Storage['setItem']>().toBeFunction()
})

test('Storage has removeItem method', () => {
  expectTypeOf<Storage>().toHaveProperty('removeItem')
  expectTypeOf<Storage['removeItem']>().toBeFunction()
})

test('Storage has key property', () => {
  expectTypeOf<Storage>().toHaveProperty('key')
  expectTypeOf<Storage['key']>().toBeString()
})
