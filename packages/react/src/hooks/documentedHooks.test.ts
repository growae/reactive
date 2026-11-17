import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import * as react from '../exports/index.js'

const site = new URL('../../../../site/', import.meta.url)
const hooks = Object.entries(react)
  .filter(
    ([name, value]) => /^use[A-Z]/.test(name) && typeof value === 'function',
  )
  .map(([name]) => name)
  .sort()

it('gives every public React hook a reference page and a sidebar entry', () => {
  const pages = readdirSync(new URL('react/api/hooks/', site))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -3))
    .sort()
  expect(pages).toEqual(hooks)

  const config = readFileSync(new URL('.vitepress/config.ts', site), 'utf8')
  const sidebar = config.slice(
    config.indexOf('function reactSidebar('),
    config.indexOf('function vueSidebar('),
  )
  for (const hook of hooks) {
    expect(sidebar).toContain(`'${hook}'`)
    const page = readFileSync(
      new URL(`react/api/hooks/${hook}.md`, site),
      'utf8',
    )
    expect(page).toContain(`# ${hook}`)
  }
})
