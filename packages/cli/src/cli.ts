#!/usr/bin/env node
import { cac } from 'cac'

import type { GenerateOptions } from './commands/generate.js'
import type { InitOptions } from './commands/init.js'
import { version } from './version.js'

const cli = cac('reactive')

cli
  .command('init', 'Create reactive config file')
  .option('-c, --config <path>', '[string] path to config file')
  .option('-r, --root <path>', '[string] root path to resolve config from')
  .action(async (options: InitOptions) => {
    const { init } = await import('./commands/init.js')
    await init(options)
    process.exit(0)
  })

cli
  .command('generate', 'Generate typed code from contract ACI')
  .option('-c, --config <path>', '[string] path to config file')
  .option('-r, --root <path>', '[string] root path to resolve config from')
  .option('-w, --watch', '[boolean] watch for changes')
  .action(async (options: GenerateOptions) => {
    const { generate } = await import('./commands/generate.js')
    await generate(options)
    if (!options.watch) process.exit(0)
  })

cli.help()
cli.version(version)

void (async () => {
  try {
    process.title = 'node (reactive)'
  } catch {}

  try {
    cli.parse(process.argv, { run: false })
    if (!cli.matchedCommand) {
      if (cli.args.length === 0) {
        if (!cli.options['help'] && !cli.options['version']) cli.outputHelp()
      } else throw new Error(`Unknown command: ${cli.args.join(' ')}`)
    }
    await cli.runMatchedCommand()
  } catch (error) {
    console.error(`\n${(error as Error).message}`)
    process.exit(1)
  }
})()
