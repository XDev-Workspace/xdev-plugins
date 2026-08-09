# ADR-0001: xdev bundles plugins by driving their native persistence surfaces, not by wrapping them

- Status: accepted
- Date: 2026-08-09

## Context

xdev sets batched modes (caveman level, ponytail level, rtk on/off) on
constituent plugins it does not own. Reference implementation
(`oh-my-pi-supreme-token-saver`) controls plugins it bundles itself, writing
session state and calling reload in its own relying counterpart. xdev's
constituents are third-party npm packages with closed internals (caveman's
mode is closure-private; ponytail exports `writeDefaultMode`; rtk has a
config file API for `enabled`).

Alternatives considered:

1. **Emitting constituent commands** (`/caveman full`, `/ponytail full`).
   The reference explicitly avoids emitting: creates recirculating
   slash-command messages and has no live write path.
2. **Reimplementing each constituent's UI surface** — forking behavior,
   exactly what the bundle must not do.
3. **Managing by persistence surfaces only** — the chosen option.

## Decision

For mode state, xdev writes exactly the same persistence each constituent
already reads itself:

- caveman: `caveman.json` `defaultLevel` + pi session entry `caveman-level`
- ponytail: `ponytail/config.json` `defaultMode` + pi session entry
  `ponytail-mode`
- rtk: `extensions/pi-rtk-optimizer/config.json` `enabled`

Session entries give the live session its mode after `ctx.reload()`; the
config-file defaults make the state stick across restarts. xdev does not
duplicate or fork any constituent logic — it matches the read surface each
plugin already honors. Mode application is a plain file/entry write, no
command emission.

For versions, `upgrade` calls pi's own plugin install (`pi install npm:name@version`),
which keeps omp's validation and rollback; the bundle only records pins.

## Consequences

- No coupling to constituent internals beyond their documented config
  files, which are stable public surfaces.
- `ctx.reload()` is required after in-session mode changes; CLI changes
  apply on next session start.
- If a constituent changes its config contract, xdev breaks loudly with a
  clear `invalid level`/missing-file error rather than corrupting it.