# CONTEXT — xdev-plugins

## Purpose

xdev is a **bundle** for Oh My Pi (omp) plugins: one package that manages a
fixed, extensible set of **constituent** plugins — installation, pinned
upgrades, and version health. It does not control plugin behavior; each
plugin's modes and toggles are its own surface (`/caveman`, `/ponytail`,
`/rtk`).

## Glossary

| Term | Meaning |
|---|---|
| **bundle** | The `xdev-plugins` package. The thing a user installs and runs. |
| **constituent** | A plugin managed by the bundle, declared in the manifest with a pinned version. Today: caveman, ponytail, rtk. |
| **manifest** | The bundle's source of truth: the constituent list with pinned versions. One file (`xdev-manifest.json` in the agent dir), seeded from the packaged `manifest.json`; pins are rewritten by `upgrade`. |
| **pin** | The exact constituent version the bundle targets. Not a range. |
| **upgrade** | Per-constituent: resolve the latest published version, install it, then rewrite the pin. |
| **check/status** | Read-only comparison per constituent: pinned vs installed vs latest. |
| **doctor** | The verifiable state of a constituent: installed version vs pin. |
| **self-upgrade** | `upgrade` also reinstalls the bundle itself (silent, non-fatal). |

## Facts that shape the model

- Versions only move forward via `upgrade`; nothing else installs or changes
  versions. Pins guarantee a reproducible, rollbackable state.
- The bundle never touches `node_modules` directly; every version change
  goes through omp's own installer and its validation/rollback.
- Mode state (levels, on/off) is owned by the constituents. History: xdev
  wrote their config files + session entries (ADR-0001) — abandoned as
  fragile and confusing; ADR-0002 supersedes it.

## Non-goals

- xdev does not package constituent code. Constituents are npm packages,
  installed through omp's plugin mechanism.
- xdev does not set or display constituent modes. Their own commands do.