---
'@growae/create-reactive': patch
---

Lift the scaffolded `typescript` devDependency pin in the `next` and `vite-react` templates from `^5.7.0` to `^7.0.2`, matching the pin already used by `vite-solid` and `vite-vanilla`.

The `core` bug that held these two templates back on TypeScript 5.7 is fixed, and TypeScript 6.0.3 and 7.0.2 both type-check clean across the packages. `vite-vue` and `nuxt` stay pinned at `^5.7.0` until `vue-tsc` supports TypeScript 7.
