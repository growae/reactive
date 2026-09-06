import { BaseError } from './base.js'

export type ReactiveProviderNotFoundErrorType =
  ReactiveProviderNotFoundError & {
    name: 'ReactiveProviderNotFoundError'
  }
export class ReactiveProviderNotFoundError extends BaseError {
  override name = 'ReactiveProviderNotFoundError'
  constructor() {
    super('`useConfig` must be used within `ReactiveProvider`.')
  }
}
