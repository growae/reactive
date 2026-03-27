import type { Config, Connector } from '@growae/reactive'
import type { MaybeRef, Ref, UnwrapRef } from 'vue'

type Primitive = string | number | boolean | bigint | symbol | undefined | null
type UnwrapLeaf =
  | Primitive
  // biome-ignore lint/complexity/noBannedTypes: support all types
  | Function
  | Date
  | Error
  | RegExp
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>

export type DeepMaybeRef<value> = MaybeRef<
  // biome-ignore lint/complexity/noBannedTypes: allowed
  value extends Function | Config | Connector
    ? value
    : value extends object | any[]
      ? {
          [key in keyof value]: DeepMaybeRef<value[key]>
        }
      : value
>

export type DeepUnwrapRef<T> = T extends UnwrapLeaf
  ? T
  : T extends Ref<infer U>
    ? DeepUnwrapRef<U>
    : // biome-ignore lint/complexity/noBannedTypes: allowed
      T extends {}
      ? {
          [Property in keyof T]: DeepUnwrapRef<T[Property]>
        }
      : UnwrapRef<T>
