# @growae/reactive-vue

## 0.0.6

### Patch Changes

- The manifest now declares `"license": "MIT"`. The licence has not changed and
  the `LICENSE` file was always shipped, but no `license` field reached npm for
  0.0.5, so registry metadata showed the package as unlicensed and dependency
  scanners read that as more restrictive than MIT rather than less.

- No API or behaviour change in this package, and no change to the `vue >=3.0.0`
  peer range. Internal test and build tooling (`nuxt`, `@nuxt/kit`,
  `@vue/test-utils`) moved within its existing ranges to clear advisories; `nuxt`
  is a peer dependency you supply, so none of that reaches your install.

- If you scaffold with `@growae/create-reactive`, its nuxt template now installs
  cleanly under plain `npm install` — see that package's 0.0.6 notes.

- Updated dependencies
  - @growae/reactive@0.0.6

## 0.0.5

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.5

## 0.0.4

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.4

## 0.0.3

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.3

## 0.0.2

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.2
