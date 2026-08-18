import type { Config } from '../createConfig'

// biome-ignore lint/suspicious/noEmptyInterface: intentionally empty for module augmentation
export interface Register {}

export type ResolvedRegister = {
  config: Register extends { config: infer config extends Config }
    ? config
    : Config
}
