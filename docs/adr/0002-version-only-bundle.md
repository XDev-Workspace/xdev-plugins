# ADR-0002: xdev manages versions only; modes stay with the constituents

- Status: accepted
- Date: 2026-08-09
- Supersedes: ADR-0001

## Context

ADR-0001 proposed xdev controlling constituent modes by driving their native
persistence surfaces (config files + pi session entries). Field experience
over 0.1.x proved the surfaces heterogeneous: plugins cache configs at
different times, re-read at different boundaries, and no programmatic live
setter exists. Cross-constituent batches (a) needed restarts to apply, (b)
produced confusing status displays, and (c) drifted from the decision of
"never fork constituent internals."

## Decision

xdev does two kinds of things and nothing else:

1. **Version lifecycle**: install constituent plugins at pinned versions,
   upgrade them to latest (rewriting pins), report pinned/installed/latest,
   and self-upgrade.
2. **Nothing about modes.** Plugin toggles and levels (caveman,
   ponytail, rtk) are owned by those plugins, exposed through their own
   commands.

Version writes go through omp's installer (`omp plugin install npm:name@version`),
keeping its validation, lockfile, and rollback. Pins live in
`xdev-manifest.json` (agent dir), outside the npm package so reinstallations
do not lose state.

## Consequences

- No coupling to constituent internals at all — only their npm identity and
  registry versions.
- Mode changes need no xdev interaction; the constituents behave exactly as
  their authors designed, visible immediacy included.
- xdev loses the "one switch for everything" UX. Accepted; it was sold on a
  wrong assumption and the mismatch cost more than it saved.