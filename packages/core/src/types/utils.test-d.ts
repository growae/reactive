import { expectTypeOf, test } from 'vitest'
import type { Compute, ExactPartial } from './utils.js'

test('ExactPartial makes all properties optional', () => {
  type Original = { a: string; b: number }
  type Partial = ExactPartial<Original>

  expectTypeOf<Partial>().toMatchTypeOf<{
    a?: string | undefined
    b?: number | undefined
  }>()
  // biome-ignore lint/complexity/noBannedTypes: testing empty object type compatibility
  expectTypeOf<{}>().toMatchTypeOf<Partial>()
})

test('ExactPartial preserves property types', () => {
  type Original = { x: boolean; y: string[] }
  type Partial = ExactPartial<Original>

  expectTypeOf<{ x: boolean }>().toMatchTypeOf<Partial>()
  expectTypeOf<{ y: string[] }>().toMatchTypeOf<Partial>()
})

test('Compute flattens intersection types', () => {
  type A = { a: string }
  type B = { b: number }
  type Computed = Compute<A & B>

  expectTypeOf<Computed>().toEqualTypeOf<{ a: string; b: number }>()
})

test('Compute preserves simple types', () => {
  type Simple = { x: string; y: number }
  type Computed = Compute<Simple>

  expectTypeOf<Computed>().toEqualTypeOf<{ x: string; y: number }>()
})
