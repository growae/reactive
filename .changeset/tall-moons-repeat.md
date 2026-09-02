---
'@growae/reactive-vue': patch
---

Bound the declared Nuxt peer range to the majors that are tested.

`peerDependencies.nuxt` and the Nuxt module's `compatibility.nuxt` move from
`>=3.0.0` to `>=3.0.0 <5.0.0`. Both majors inside that range are now proven by
a real `nuxt build` in CI against pinned Nuxt 3 and Nuxt 4 fixture apps; the
previous open range vouched for every future major sight-unseen.

**Consumer-visible.** No published Nuxt version is excluded by the cap — Nuxt 4
is current — so nothing breaks today, but the declared surface has changed. A
future Nuxt 5 will need this range widened deliberately, on evidence, rather
than inheriting a claim nobody made.

The floor stays at `3.0.0` and is not narrowed to the exact versions tested:
the module uses only `defineNuxtModule`, `addPlugin`, `addImports` and
`createResolver`, all stable in `@nuxt/kit` since 3.0.0.
