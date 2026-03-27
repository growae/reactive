import { blue, cyan, green, magenta, yellow } from 'kolorist'

export type Variant = {
  name: string
  display: string
  color: (str: string) => string
}

export type Framework = {
  name: string
  display: string
  color: (str: string) => string
  variants: readonly Variant[]
}

export const frameworks: readonly Framework[] = [
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      { name: 'vite-react', display: 'Vite + React', color: blue },
      { name: 'next', display: 'Next.js', color: yellow },
    ],
  },
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      { name: 'vite-vue', display: 'Vite + Vue', color: blue },
      { name: 'nuxt', display: 'Nuxt', color: green },
    ],
  },
  {
    name: 'solid',
    display: 'Solid',
    color: blue,
    variants: [
      { name: 'vite-solid', display: 'Vite + Solid', color: blue },
    ],
  },
  {
    name: 'vanilla',
    display: 'Vanilla',
    color: magenta,
    variants: [
      { name: 'vite-vanilla', display: 'Vite + Vanilla', color: yellow },
    ],
  },
]
