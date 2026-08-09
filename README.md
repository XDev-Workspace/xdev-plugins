# xdev-plugins

Bundle manager for Oh My Pi (omp/pi) plugins: installs, pins, checks, and
upgrades a fixed set of plugins. Ships as an npm CLI (`xdev`) plus an
in-session `/xdev` command.

What xdev does — and nothing else:

- installs missing constituents
- upgrades them to latest, rewriting its pins
- reports pinned / installed / latest versions
- self-upgrades

Plugin toggles and modes are the plugins' own business: use `/caveman`,
`/ponytail`, `/rtk` directly.

## Bundled plugins

| Plugin | Role |
|---|---|
| [`pi-caveman`](https://www.npmjs.com/package/pi-caveman) | terse replies |
| [`@dietrichgebert/ponytail`](https://www.npmjs.com/package/@dietrichgebert/ponytail) | lazy/minimal-code guidance |
| [`pi-rtk-optimizer`](https://www.npmjs.com/package/pi-rtk-optimizer) | compact shell output |

## Install

Requires Node 18+ and [Oh My Pi](https://github.com/can1357/oh-my-pi).

```bash
npm install -g xdev-plugins          # the `xdev` CLI
omp plugin install npm:xdev-plugins  # the /xdev command (or `omp plugin link <path>` for dev)
xdev install                         # install bundled constituents (missing only)
```

Restart omp (or run `/reload-plugins`).

## Commands

### In-session

| Command | Effect |
|---|---|
| `/xdev` / `/xdev status` | per-plugin versions: pinned / installed / latest |
| `/xdev upgrade [name ...]` | update plugins to latest, rewrite pins, self-upgrade, reload; `--dry-run` previews |
| `/xdev doctor` | installed-vs-pin report |

### CLI (`xdev`)

```bash
xdev install                 # install missing constituents
xdev upgrade [name ...]      # update to latest, rewrite pins; --dry-run
xdev status [name ...]     # pinned / installed / latest table
xdev doctor                  # per-constituent health + `omp plugin doctor`
xdev version
```

Flags: `--dry-run`, `--scope user|project|marketplace` (accepted; npm
installs are user-scope in omp).

## How it works

- Pins live in `xdev-manifest.json` in the omp agent dir (`~/.omp/agent/`),
  seeded from the bundled `manifest.json` on first run. `upgrade` rewrites
  pins; rollback = revert pins, reinstall the old versions.
- Version changes run only through omp's own installer
  (`omp plugin install npm:<name>@<version>`), keeping its validation and
  rollback. The bundle never touches `node_modules` directly.

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
npm publish            # release = version bump + publish
```

## License

MIT