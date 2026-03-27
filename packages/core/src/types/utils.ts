export type Compute<type> = { [key in keyof type]: type[key] } & unknown

export type ExactPartial<type> = {
  [key in keyof type]?: type[key] | undefined
}

export type IsNarrowable<type, type2> = IsUnknown<type> extends true
  ? false
  : undefined extends type
    ? false
    : IsNever<
          (type extends type2 ? true : false) &
            (type2 extends type ? false : true)
        > extends true
      ? false
      : true

export type IsNever<type> = [type] extends [never] ? true : false

export type IsUnknown<type> = unknown extends type ? true : false

export type Merge<obj1, obj2> = Compute<
  LooseOmit<obj1, keyof obj2 extends infer key extends string ? key : never> &
    obj2
>

export type Mutable<type extends object> = {
  -readonly [key in keyof type]: type[key]
}

export type StrictOmit<type, keys extends keyof type> = Pick<
  type,
  Exclude<keyof type, keys>
>

export type OneOf<
  union extends object,
  keys extends KeyofUnion<union> = KeyofUnion<union>,
> = union extends infer Item
  ? Compute<Item & { [K in Exclude<keys, keyof Item>]?: undefined }>
  : never
type KeyofUnion<type> = type extends type ? keyof type : never

export type PartialBy<type, key extends keyof type> = ExactPartial<
  Pick<type, key>
> &
  StrictOmit<type, key>

export type RemoveUndefined<type> = {
  [key in keyof type]: NonNullable<type[key]>
}

export type RequiredBy<type, key extends keyof type> = Omit<type, key> &
  ExactRequired<Pick<type, key>>

export type ExactRequired<type> = {
  [key in keyof type]-?: Exclude<type[key], undefined>
}

export type LooseOmit<type, keys extends string> = Pick<
  type,
  Exclude<keyof type, keys>
>

export type UnionCompute<type> = type extends object ? Compute<type> : type

export type UnionLooseOmit<type, keys extends string> = type extends any
  ? LooseOmit<type, keys>
  : never

export type UnionStrictOmit<type, keys extends keyof type> = type extends any
  ? StrictOmit<type, keys>
  : never

export type UnionExactPartial<type> = type extends object
  ? ExactPartial<type>
  : type
