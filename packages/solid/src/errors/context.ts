import { BaseError } from './base'

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
