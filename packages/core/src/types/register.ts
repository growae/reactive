import type { Config } from '../createConfig'

// biome-ignore lint/complexity/noBannedTypes: intentionally empty for module augmentation
export type Register = {}

export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
