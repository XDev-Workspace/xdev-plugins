# CONTEXT — xdev-plugins

## Purpose

xdev is a **bundle** for Oh My Pi (omp) plugins: one package that controls a
fixed, extensible set of **constituent** plugins, and manages their
installation, pinned upgrades, health, and batched on/off/intensity modes.

## Glossary

| Term | Meaning |
|---|---|
| **bundle** | The `xdev-plugins` package. The thing a user installs and runs. |
| **constituent** | A plugin managed by the bundle. Declared in the manifest with a pinned version. Today: caveman, ponytail, rtk. |
| **manifest** | The bundle's source of truth: the constituent list with pinned versions. One file; pinned versions are rewritten by `upgrade`. |
| **pin** | The exact constituent version the bundle currently targets. Not a range. |
| **level** | The intensity x sets on the mode-capable constituents (caveman, ponytail). `off`, lite, full, ultra. |
| **mode set** | The batch operation that applies a level or on/off: caveman + ponytail level, rtk enabled. |
| **upgrade** | Per-constituent: resolve the latest published version, install it, then rewrite the pin. |
| **check/status** | Read-only comparison per constituent: pinned vs installed vs latest. |
| **doctor** | The verifiable state of a constituent: installed version matches pin, plus any registry and mount checks. |
| **on/off** | Bundle-wide enable/disable. On = caveman full, ponytail full, rtk on. Off = all three off. |

## Facts that shape the model

- Individual tweaks win: after `/xdev lite`, a hand-run `/ponytail full`
  sticks (last modification wins). `status` reports the actual state, not the
  last x command. rtk is the exception: it hard-follows bundle on/off.
- Versions only move forward via `upgrade`; nothing else installs or changes
  versions. Pins guarantee a reproducible, rollbackable state.
- The bundle never forks or rewrites constituent code; it drives each
  constituent exactly through the same persistence surface the constituent
  uses itself.

## Non-goals

- xdev does not package constituent code. Constituents are npm packages,
  installed through pi's own plugin mechanism.
- xdev does not fix broken constituents; `doctor` only reports. Repair is
  reinstalling the pin.