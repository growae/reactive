import { BaseError } from './base'

export type ReactivePluginNotFoundErrorType = ReactivePluginNotFoundError & {
  name: 'ReactivePluginNotFoundError'
}
export class ReactivePluginNotFoundError extends BaseError {
  override name = 'ReactivePluginNotFoundError'
  constructor() {
    super(
      'No `config` found in Vue context, use `ReactivePlugin` to properly initialize the library.',
    )
  }
}

export type ReactiveInjectionContextErrorType =
  ReactiveInjectionContextError & {
    name: 'ReactiveInjectionContextError'
  }
export class ReactiveInjectionContextError extends BaseError {
  override name = 'ReactiveInjectionContextError'
  constructor() {
    super(
      'Reactive composables can only be used inside `setup()` function or functions that support injection context.',
    )
  }
}
