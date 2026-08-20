// Drift detection for the committed reference corpora.
//
//   node regenerate.mjs            # check: fails if a corpus is not reproducible
//   node regenerate.mjs --write    # rewrite them, so a bump produces a git diff
//
// Both corpora are committed so the Rust tests are offline and bisectable. That
// is only sound while the committed bytes are the bytes the pinned reference
// still produces. Without this check "byte-identical to `@aeternity/aepp-sdk`
// 14.1.1" decays into "byte-identical to whatever it produced on the day someone
// ran the generator", and the first dependency bump that changes an encoding
// passes a green suite.
//
// The pinned versions are not configured here. Each corpus records the version
// it came from, and this script installs exactly that — so the pin lives in the
// artifact it describes and there is no second copy to fall out of step.

import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The repository's lint rules allow `console.log` and nothing else, and a
// failure message belongs on stderr rather than stdout — where, for the
// generators these scripts drive, stdout is the corpus itself.
const stderr = (...parts) => process.stderr.write(`${parts.join(' ')}\n`)

const here = dirname(fileURLToPath(import.meta.url))
const crates = dirname(here)
const write = process.argv.includes('--write')

/**
 * Every committed corpus, each with the generator that produces it and the field
 * the corpus records its own reference version in.
 *
 * The sweep corpus was committed without an entry here, so 523 of the 636
 * committed FATE vectors were re-derived by nothing and clause 5 was scored over
 * the two files that happened to be listed. That is the same defect class the
 * matrix had: a corpus file is invisible by default. `tests/reachability.rs`
 * now fails the build when a committed corpus is not named in this file.
 */
const corpora = [
  {
    label: 'transactions',
    package: '@aeternity/aepp-sdk',
    generator: join(crates, 'ae-core/tests/generate-vectors.mjs'),
    committed: join(crates, 'ae-core/tests/vectors/transactions.json'),
    version: (json) => json.sdkVersion,
  },
  {
    label: 'fate',
    package: '@aeternity/aepp-calldata',
    generator: join(crates, 'ae-fate/tests/vectors/generate.mjs'),
    committed: join(crates, 'ae-fate/tests/vectors/aepp-calldata-1.9.1.json'),
    version: (json) => json.version,
  },
  {
    // Two of its 523 cases are `node-order/…`, assembled by the generator
    // rather than written by the reference. They are still regenerated from
    // this same script: the generator is deterministic and serialises every key
    // and value through the reference, so a drift in either is caught here even
    // though the key *order* is stated by hand.
    label: 'fate-sweep',
    package: '@aeternity/aepp-calldata',
    generator: join(crates, 'ae-fate/tests/vectors/generate-sweep.mjs'),
    committed: join(
      crates,
      'ae-fate/tests/vectors/aepp-calldata-1.9.1-sweep.json',
    ),
    version: (json) => json.version,
  },
]

/**
 * Report the first difference between two texts, with enough context to review.
 * Line and column rather than a full diff: the committed file is regenerated
 * wholesale, so `--write` plus `git diff` is the reviewable form and this is
 * only ever the failure message.
 */
function describeDifference(expected, actual) {
  const left = expected.split('\n')
  const right = actual.split('\n')
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) {
      return [
        `first difference at line ${index + 1}`,
        `  committed:   ${left[index] ?? '<end of file>'}`,
        `  regenerated: ${right[index] ?? '<end of file>'}`,
        `committed ${left.length} lines, regenerated ${right.length} lines`,
      ].join('\n')
    }
  }
  return 'texts differ only in trailing bytes'
}

const scratch = mkdtempSync(join(tmpdir(), 'reactive-parity-'))
let failures = 0

try {
  writeFileSync(
    join(scratch, 'package.json'),
    `${JSON.stringify({ name: 'parity-regenerate', private: true, type: 'module' }, null, 2)}\n`,
  )

  // `path` and `text` stay separate fields. An earlier revision reused one name
  // for both, which the check path never noticed because it only ever compares —
  // and `--write` then tried to open the whole corpus as a filename.
  const pins = corpora.map((corpus) => {
    const text = readFileSync(corpus.committed, 'utf8')
    const version = corpus.version(JSON.parse(text))
    if (!version) {
      throw new Error(
        `${corpus.committed} does not record its reference version`,
      )
    }
    return {
      ...corpus,
      path: corpus.committed,
      text,
      pinned: `${corpus.package}@${version}`,
      version,
    }
  })

  // Two corpora can pin the same package — the FATE corpus and its sweep both
  // record `@aeternity/aepp-calldata`. Deduplicated so the install line names
  // each version once, and so a genuine disagreement between two corpora about
  // the same package shows up as two entries rather than being averaged away by
  // whichever npm resolved last.
  const installs = [...new Set(pins.map((pin) => pin.pinned))]
  console.log(`installing ${installs.join(', ')}`)
  execFileSync(
    'npm',
    ['install', '--no-audit', '--no-fund', '--loglevel=error', ...installs],
    { cwd: scratch, stdio: 'inherit' },
  )

  for (const pin of pins) {
    // Node resolves a bare specifier from the importing *module's* directory,
    // not from the working directory, so a generator living under `crates/`
    // cannot see a package installed anywhere else. Copying it next to the
    // install is what makes regeneration reproducible from any checkout.
    const copied = join(scratch, `generate-${pin.label}.mjs`)
    copyFileSync(pin.generator, copied)
    const regenerated = execFileSync('node', [copied], {
      cwd: scratch,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })

    if (regenerated === pin.text) {
      console.log(`${pin.label}: reproducible from ${pin.pinned}`)
      continue
    }

    if (write) {
      writeFileSync(pin.path, regenerated)
      console.log(
        `${pin.label}: rewritten from ${pin.pinned} — review the diff`,
      )
      continue
    }

    failures += 1
    stderr(
      `${pin.label}: DRIFT — the committed corpus is not what ${pin.pinned} produces`,
    )
    stderr(describeDifference(pin.text, regenerated))
    stderr(
      'Re-run with --write to take the new bytes, then review the diff and the ' +
        'parity matrix before committing.',
    )
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

process.exit(failures === 0 ? 0 : 1)
