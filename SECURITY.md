# Security Policy

Reactive is a client-side library. A defect here can reach the wallets, keys and
funds of everyone using an application built on it, so we would rather hear about
a suspected problem early and be wrong than hear about it late and be right.

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for a security
problem.** A public report is visible to everyone, including whoever would use it,
from the moment you press submit.

Report it privately instead:

> **[Report a vulnerability](https://github.com/growae/reactive/security/advisories/new)**
> — or, in this repository, **Security → Advisories → Report a vulnerability**

The report is visible only to the maintainers until an advisory is published. You
do not need a special account or an invitation; the link works for anyone with a
GitHub account.

If you cannot use GitHub for this, open a public issue containing only the words
`security report — requesting a private channel` and no detail whatsoever, and a
maintainer will open one with you.

### What to include

Report what you have. An incomplete report that arrives is worth more than a
perfect one that does not.

- Which package and version — for example `@growae/reactive-react@0.0.5`.
- Which framework binding and runtime, if it matters: React, Solid, Vue, Node,
  browser.
- What an attacker gets out of it, and what they need to already have.
- The smallest reproduction you can manage. A failing test or a short snippet
  beats a description.

## What happens next

| Stage | What we commit to |
| --- | --- |
| Acknowledgement | A human reply within **2 business days**. Not an auto-close, not a bot. |
| Assessment | Within **10 business days** we tell you whether we can reproduce it, how we rate it, and the timeline we intend to work to. |
| Fix and advisory | We publish a GitHub advisory with the fix. Coordinated disclosure, **90 days** by default, and we will agree a different date with you if the situation calls for one. |

If a deadline here slips, we will say so and give you a new one rather than go
quiet. Silence is the failure mode we are trying to avoid.

We do not run a paid bug bounty programme. We do credit reporters — see below.

## Scope

**In scope** — the packages published from this repository:

`@growae/reactive` · `@growae/reactive-connectors` · `@growae/reactive-cli` ·
`@growae/reactive-react` · `@growae/reactive-solid` · `@growae/reactive-vue` ·
`@growae/create-reactive`

**Out of scope, and where it belongs instead:**

- **The æternity protocol, node or `@aeternity/aepp-sdk`.** Reactive wraps the
  æternity Foundation's SDK; it does not implement the protocol, sign
  transactions itself or derive keys itself. A flaw in the SDK or in the chain
  belongs upstream, with the æternity Foundation. If you are unsure which side of
  that line you are on, report it here and we will route it.
- **Wallet extensions and third-party connectors** not published from this
  repository.
- **The documentation site** as a hosted property, unless the flaw comes from
  code in this repository.

### Two things that look like findings and are not

- **Test fixtures in this repository are public on purpose.** `test/` contains
  æternity **devnet** material — a local, throwaway chain started from
  `docker-compose.yml` with no value on it. Those keys are published deliberately
  so that the integration suite runs without a secret. Finding them is not a
  vulnerability and they will not be rotated.
- **A dependency advisory is not, by itself, a vulnerability report.** This
  repository's dependencies are tracked with Dependabot and worked on a weekly
  cadence, so a raw alert number tells us nothing we do not already have. What we
  do want privately is an advisory you can show reaches a *published* package
  through a real path — a transitive development dependency that never ships to a
  consumer is a different and much smaller problem. If you have that path, it is
  in scope and we want it.

## Supported versions

Reactive is pre-1.0 and every package is versioned together.

| Version | Supported |
| --- | --- |
| `0.0.x` — latest published release | Yes |
| Anything older | No — upgrade to the latest release |

Being honest about what that means: fixes land on the latest version. We do not
backport to earlier `0.0.x` releases, and we will not promise a patch train that
a pre-1.0 library cannot keep. If you are pinned to an older version and cannot
move, say so in the report and we will tell you what your options actually are.

## Credit

We name reporters in the advisory unless you ask us not to. Tell us how you want
to be credited, or that you would rather not be.
