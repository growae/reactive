import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { green, reset } from 'kolorist'
import prompts from 'prompts'

import { type Framework, frameworks } from './frameworks'
import {
  copy,
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  toValidPackageName,
} from './utils'

const templates = frameworks.flatMap((f) => f.variants.map((v) => v.name))

const renameFiles: Record<string, string | undefined> = {
  '_env.local': '.env.local',
  _gitignore: '.gitignore',
}

const defaultTargetDir = 'reactive-project'

export type CreateReactiveOptions = {
  targetDir?: string
  template?: string
  pnpm?: boolean
  npm?: boolean
  yarn?: boolean
  bun?: boolean
}

export async function createReactive(
  options: CreateReactiveOptions = {},
): Promise<void> {
  const argTargetDir = formatTargetDir(options.targetDir)
  const argTemplate = options.template

  let targetDir = argTargetDir || defaultTargetDir

  function getProjectName() {
    return targetDir === '.' ? path.basename(path.resolve()) : targetDir
  }

  let result: prompts.Answers<
    'framework' | 'overwrite' | 'packageName' | 'projectName' | 'variant'
  >
  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultTargetDir,
          onState(state: { value: string }) {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type() {
            return !fs.existsSync(targetDir) || isEmpty(targetDir)
              ? null
              : 'confirm'
          },
          name: 'overwrite',
          message() {
            return `${
              targetDir === '.'
                ? 'Current directory'
                : `Target directory "${targetDir}"`
            } is not empty. Remove existing files and continue?`
          },
        },
        {
          type(_: unknown, values: { overwrite?: boolean }) {
            if (values.overwrite === false)
              throw new Error('Operation cancelled')
            return null
          },
          name: 'overwriteChecker',
        },
        {
          type() {
            return isValidPackageName(getProjectName()) ? null : 'text'
          },
          name: 'packageName',
          message: reset('Package name:'),
          initial() {
            return toValidPackageName(getProjectName())
          },
          validate(dir: string) {
            return isValidPackageName(dir) || 'Invalid package.json name'
          },
        },
        {
          type:
            argTemplate && templates.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !templates.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `,
                )
              : reset('Select a framework:'),
          initial: 0,
          choices: frameworks.map((framework) => ({
            title: framework.color(framework.display),
            value: framework,
          })),
        },
        {
          type(framework: Framework) {
            return framework?.variants?.length > 1 ? 'select' : null
          },
          name: 'variant',
          message: reset('Select a variant:'),
          choices(framework: Framework) {
            return framework.variants.map((variant) => ({
              title: variant.color(variant.display),
              value: variant.name,
            }))
          },
        },
      ],
      {
        onCancel() {
          throw new Error('Operation cancelled')
        },
      },
    )
  } catch (error) {
    console.log((error as Error).message)
    return
  }

  const {
    framework,
    overwrite,
    packageName,
    variant = framework?.variants[0]?.name,
  } = result

  const cwd = process.cwd()
  const root = path.join(cwd, targetDir)

  if (overwrite) emptyDir(root)
  else if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true })

  const template: string = variant || framework?.name || argTemplate

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  type PkgManager = 'bun' | 'npm' | 'pnpm' | 'yarn'
  let pkgManager: PkgManager
  if (options.bun) pkgManager = 'bun'
  else if (options.npm) pkgManager = 'npm'
  else if (options.pnpm) pkgManager = 'pnpm'
  else if (options.yarn) pkgManager = 'yarn'
  else pkgManager = pkgInfo ? (pkgInfo.name as PkgManager) : 'npm'

  console.log(`\nScaffolding project in ${root}...`)

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../templates',
    template,
  )

  function write(file: string, content?: string) {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) fs.writeFileSync(targetPath, content)
    else copy(path.join(templateDir, file), targetPath)
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  ) as Record<string, unknown>

  pkg.name = packageName || getProjectName()

  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  const cdProjectName = path.relative(cwd, root)
  console.log(green('\nDone. Now run:\n'))
  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`,
    )
  }

  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}
