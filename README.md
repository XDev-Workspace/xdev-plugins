# xdev-plugins

Bundle manager for Oh My Pi (omp/pi) plugins. One package controls caveman,
ponytail, and rtk: batched intensity modes, pinned upgrades, and health
checks. Ships as an npm CLI (`xdev`) plus an in-session `/xdev` command.

## Install

```bash
npm install -g xdev-plugins
xdev install        # installs bundled plugins (missing only)
```

Restart omp (or run `/reload-plugins`), then:

```text
/xdev status        table of pinned vs installed vs latest per plugin
```

## Commands

### In-session

| Command | Effect |
|---|---|
| `/xdev on` | caveman full + ponytail full + rtk on, reload |
| `/xdev off` | all three off, reload |
| `/xdev lite\|full\|ultra` | set caveman + ponytail to that level (rtk untouched), reload |
| `/xdev status` / `/xdev check` | versions + update availability |
| `/xdev upgrade [name ...]` | update plugins to latest, rewrite pins, reload; `--dry-run` previews |
| `/xdev doctor` | per-plugin installed-vs-pin report |

Individual tweaks win: `/xdev lite` then `/ponytail off` leaves ponytail
off; `/xdev status` shows the truth. rtk is the exception — it follows
bundle on/off.

### CLI (`xdev`)

```bash
xdev install                 # install missing constituents
xdev upgrade [name ...]      # update to latest, pin, report; --dry-run
xdev check|status [name ...] # pinned / installed / latest table
xdev on|off|<level>          # batched modes (no reload; restart or /reload-plugins)
xdev doctor                  # per-constituent health + pi plugin doctor
xdev version
```

Flags: `--dry-run`, `--scope user|project|both` (accepted; npm installs
are user-scope in omp).

## How it works

- `xdev-manifest.json` in the agent dir (`~/.omp/agent/`) is the
  source of truth: constituents + immutable pins. Seeded from the packaged
  `manifest.json`; `upgrade` rewrites pins. Rollback = revert pins and
  `pi install` the old versions again.
- Version changes always run through pi's own installer
  (`pi install npm:name@version`, omp's rollback stays active). The bundle
  never touches node_modules directly.
- Mode batches write the same persistence surfaces the constituents read
  themselves (config files + pi session entries), then `ctx.reload()`.
  See `docs/adr/0001-xdev-bundle-by-persistence.md`.

## Extending the bundle

Add a line to `manifest.json` and bump the package. Constituents may be
added or dropped freely; the state manifest reseeds missing entries.

```json
{ "name": "pi-caveman", "pin": "1.0.8" }
```

## Development

```bash
node --test              # unit tests (agent-dir isolated)
```