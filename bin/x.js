#!/usr/bin/env node
import {
  loadManifest,
  saveManifest,
  installedVersion,
  registryLatest,
  piInstall,
  normalizeLevel,
  LEVELS,
} from "../lib/core.js";
import { setCavemanDefault, setPonytailDefault, setRtkEnabled } from "../lib/modes.js";
import { spawnSync } from "node:child_process";

const USAGE = `xdev — bundle manager for pi/omp plugins

Usage:
  xdev install                     install all bundled plugins (missing only)
  xdev upgrade [name ...]          update plugins to latest; --dry-run to preview
  xdev check [name ...]            versions: pinned / installed / latest
  xdev status                      same as check
  xdev on|off                      enable/disable all bundled modes
  xdev <level>                     set caveman + ponytail level (${LEVELS.join("|")})
  xdev doctor                      run pi plugin doctor per constituent
  xdev version                     print version
Flags: --dry-run, --scope user|project|both
`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const scopeIdx = args.indexOf("--scope");
const scope = args.find((a) => a.startsWith("--scope="))?.split("=")[1] ?? (scopeIdx >= 0 ? args[scopeIdx + 1] : undefined);
const positional = args.filter((a) => !a.startsWith("--"));

async function main() {
  const [cmd, ...rest] = positional;

  if (scope && scope !== "user") {
    console.warn(`--scope ${scope} only applies to marketplace installs; npm plugins are user-scope`);
  }

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(USAGE);
    return cmd ? 0 : 1;
  }

  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    console.log(loadManifest().package);
    return 0;
  }

  if (cmd === "install") {
    const manifest = loadManifest();
    let changed = 0;
    for (const p of manifest.plugins) {
      if (installedVersion(p.name)) {
        console.log(`✓ ${p.name}@${p.pin} installed`);
        continue;
      }
      console.log(`→ installing ${p.name}@${p.pin}`);
      const r = piInstall(`npm:${p.name}@${p.pin}`, { dryRun });
      if (!r.ok) {
        console.error(`✗ ${r.stderr}`);
        return 1;
      }
      changed++;
    }
    console.log(changed ? `${changed} plugin(s) installed` : "all present");
    return 0;
  }

  if (cmd === "upgrade") {
    const manifest = loadManifest();
    const wanted = rest.length ? rest : manifest.plugins.map((p) => p.name);
    let failed = false;
    for (const p of manifest.plugins) {
      if (!wanted.includes(p.name)) continue;
      const latest = await registryLatest(p.name);
      if (latest === null) {
        console.log(`✗ ${p.name} not on registry`);
        failed = true;
        continue;
      }
      const installed = installedVersion(p.name);
      if (installed === latest) {
        console.log(`✓ ${p.name}@${latest} up to date`);
        continue;
      }
      if (dryRun) {
        console.log(`→ ${p.name}: ${installed ? `${p.pin} → ${latest}` : `MISSING → install ${latest}`} (dry-run)`);
        continue;
      }
      console.log(`→ upgrading ${p.name} ${installed ?? "MISSING"} → ${latest}`);
      const r = piInstall(`npm:${p.name}@${latest}`, {});
      if (!r.ok) {
        console.error(`✗ ${r.stderr}`);
        failed = true;
        continue;
      }
      p.pin = latest;
    }
    saveManifest(manifest);
    if (!dryRun) console.log("run /reload-plugins (or restart omp) to apply");
    return failed ? 1 : 0;
  }

  if (cmd === "check" || cmd === "status") {
    const manifest = loadManifest();
    const wanted = rest.length ? rest : manifest.plugins.map((p) => p.name);
    console.log("plugin                    pinned      installed   latest");
    for (const p of manifest.plugins) {
      if (!wanted.includes(p.name)) continue;
      const installed = installedVersion(p.name) ?? "MISSING";
      let latest = "?";
      try {
        latest = (await registryLatest(p.name)) ?? "GONE";
      } catch (e) {
        latest = `ERR ${String(e).slice(0, 20)}`;
      }
      const flag = installed === "MISSING" ? "✗" : installed !== latest ? "~" : "✓";
      console.log(`${flag} ${p.name.padEnd(28)} ${p.pin.padEnd(11)} ${installed.padEnd(11)} ${latest}`);
    }
    return 0;
  }

  if (cmd === "on" || cmd === "off" || normalizeLevel(cmd)) {
    const level = cmd === "on" ? "full" : cmd === "off" ? "off" : normalizeLevel(cmd);
    setCavemanDefault(level);
    setPonytailDefault(level === "off" ? "off" : level);
    setRtkEnabled(cmd !== "off");
    console.log(`xdev ${cmd}: caveman=${level} ponytail=${level} rtk=${cmd !== "off" ? "on" : "off"}`);
    console.log("restart omp or run /reload-plugins to apply");
    return 0;
  }

  if (cmd === "doctor") {
    const manifest = loadManifest();
    for (const p of manifest.plugins) {
      const installed = installedVersion(p.name) ?? "MISSING";
      console.log(`${installed === "MISSING" ? "✗" : "✓"} ${p.name} ${installed} (pin ${p.pin})`);
    }
    const r = spawnSync("pi", ["plugin", "doctor"], { encoding: "utf8" });
    if (r.stdout) console.log(r.stdout.trim());
    if (r.stderr) console.error(r.stderr.trim());
    return r.status === 0 ? 0 : 1;
  }

  console.error(`unknown command: ${cmd}`);
  console.log(USAGE);
  return 1;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(1);
});