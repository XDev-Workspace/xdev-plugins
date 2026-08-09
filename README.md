# xdev-plugins

Bundle manager for Oh My Pi (omp/pi) plugins. One package controls caveman,
ponytail, and rtk: batched intensity modes, pinned upgrades, and health
checks. Ships as an npm CLI (`xdev`) plus an in-session `/xdev` command.

## What it bundles

| Plugin | Role |
|---|---|
| [`pi-caveman`](https://www.npmjs.com/package/pi-caveman) | terse replies |
| [`@dietrichgebert/ponytail`](https://www.npmjs.com/package/@dietrichgebert/ponytail) | lazy/minimal-code guidance |
| [`pi-rtk-optimizer`](https://www.npmjs.com/package/pi-rtk-optimizer) | compact shell output |

Versions are pinned; `upgrade` moves them forward explicitly.

## Install

Requires Node 18+ and [Oh My Pi](https://github.com/can1357/oh-my-pi).

```bash
npm install -g xdev-plugins          # installs the `xdev` CLI
omp plugin install npm:xdev-plugins  # registers the /xdev command (or: omp plugin link <path> for local dev)
xdev install                 # installs bundled constituent plugins (missing only)
```

Restart omp (or run `/reload-plugins`), then:

```text
/xdev status        table of pinned vs installed vs latest per plugin
/xdev on            enable everything
```

## Commands

### In-session

| Command | Effect |
|---|---|
| `/xdev on` | caveman full + ponytail full + rtk on, then reload |
| `/xdev off` | all three off, then reload |
| `/xdev lite\|full\|ultra` | set caveman + ponytail to that level (rtk untouched), then reload |
| `/xdev status` / `/xdev check` | per-plugin versions + update availability |
| `/xdev upgrade [name ...]` | update plugins to latest, rewrite pins, self-upgrade, reload; `--dry-run` previews |
| `/xdev doctor` | per-plugin installed-vs-pin report |

Modes: individual tweaks win. `/xdev lite` then `/ponytail off` leaves
ponytail off; `/xdev status` shows truth. **rtk is the exception** — it
hard-follows `/xdev on` / `/xdev off`.

### CLI (`xdev`)

```bash
xdev install                 # install missing constituents
xdev upgrade [name ...]      # update to latest, rewrite pins; --dry-run
xdev check|status [name ...] # pinned / installed / latest table
xdev on|off|<level>          # batched modes (applies next session; restart or /reload-plugins)
xdev doctor                  # per-constituent health + `omp plugin doctor`
xdev version
```

Flags: `--dry-run`, `--scope user|project|both` (accepted; npm installs are
user-scope in omp).

## How it works

- Pins live in `xdev-manifest.json` inside the omp agent dir
  (`~/.omp/agent/`), seeded from the packaged `manifest.json` on first run.
  `upgrade` rewrites pins; rollback = revert pins, reinstate old versions.
- Version changes run only through omp's own installer
  (`omp plugin install npm:<name>@<version>`), keeping its validation and
  rollback. The bundle never touches `node_modules` directly.
- Mode batches write the same persistence surfaces each constituent reads
  itself (their config files + pi session entries), then `ctx.reload()`.

Details: `docs/adr/0001-xdev-bundle-by-persistence.md`.

## Extending the bundle

Edit `manifest.json`, bump the package version, publish:

```json
{ "name": "pi-caveman", "pin": "1.0.8" }
```

Add or drop constituents freely; existing state manifests reseed missing
entries automatically.

## Development

```bash
node --test              # unit tests (agent-dir isolated)
npm publish             # requires npm auth; release = version bump + publish
```

## License

MIT