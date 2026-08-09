// /xdev — bundle manager: install/update constituent plugins, pinned versions.
// No mode control; constituents own their own toggles and state.
import { spawnSync } from "node:child_process";
import {
  loadManifest,
  saveManifest,
  installedVersion,
  registryLatest,
  piInstall,
} from "../lib/core.js";

async function versionTable() {
  const manifest = loadManifest();
  const lines = [];
  for (const p of manifest.plugins) {
    const installed = installedVersion(p.name) ?? "MISSING";
    let latest = "?";
    try {
      latest = (await registryLatest(p.name)) ?? "GONE";
    } catch {
      latest = "ERR";
    }
    const flag = installed === "MISSING" ? "✗" : installed !== latest ? "~" : "✓";
    lines.push(`${flag} ${p.name}: pin ${p.pin} · installed ${installed} · latest ${latest}`);
  }
  return lines;
}

export default function xdevExtension(pi) {
  pi.setLabel?.("xdev (plugin bundle manager)");

  pi.registerCommand("xdev", {
    description:
      "Manage bundled plugins. /xdev [status|check|upgrade [names]|doctor] [--dry-run]",
    handler: async (args, ctx) => {
      const raw = String(args || "").trim();
      const dryRun = raw.includes("--dry-run");
      const tokens = raw.split(/\s+/).filter((t) => t && !t.startsWith("--"));
      const [cmd, ...rest] = tokens;

      try {
        if (!cmd || cmd === "status" || cmd === "check") {
          ctx?.ui?.notify?.((await versionTable()).join("\n"), "info");
          return;
        }

        if (cmd === "upgrade") {
          const manifest = loadManifest();
          const wanted = rest.length ? rest : manifest.plugins.map((p) => p.name);
          const lines = [];
          let failed = false;
          for (const p of manifest.plugins) {
            if (!wanted.includes(p.name)) continue;
            const latest = await registryLatest(p.name);
            if (latest === null) {
              lines.push(`✗ ${p.name} not on registry`);
              failed = true;
              continue;
            }
            const installed = installedVersion(p.name);
            if (installed === latest) {
              lines.push(`✓ ${p.name}@${latest} up to date`);
              continue;
            }
            if (dryRun) {
              lines.push(`→ ${p.name}: ${installed ? `${p.pin} → ${latest}` : `MISSING → install ${latest}`} (dry-run)`);
              continue;
            }
            const r = piInstall(`npm:${p.name}@${latest}`, {});
            if (!r.ok) {
              lines.push(`✗ ${p.name}: ${r.stderr}`);
              failed = true;
              continue;
            }
            p.pin = latest;
            lines.push(`↑ ${p.name}: ${installed ?? "MISSING"} → ${latest}`);
          }
          saveManifest(manifest);

          if (!dryRun) {
            try {
              const self = spawnSync("npm", ["install", "-g", "xdev-plugins@latest"], { encoding: "utf8" });
              lines.push(self.status === 0 ? "↑ xdev-plugins self-upgraded" : `⚠ self-upgrade: ${self.stderr.trim().slice(0, 80)}`);
            } catch (e) {
              lines.push(`⚠ self-upgrade skipped: ${String(e?.message ?? e).slice(0, 60)}`);
            }
          }

          ctx?.ui?.notify?.(lines.join("\n") + (failed ? "\n⚠ some updates failed" : ""), failed ? "warning" : "info");
          // New plugin code needs a reload to load.
          if (!dryRun && ctx?.reload) await ctx.reload();
          return;
        }

        if (cmd === "doctor") {
          const manifest = loadManifest();
          const lines = manifest.plugins.map((p) => {
            const installed = installedVersion(p.name) ?? "MISSING";
            return `${installed === "MISSING" ? "✗" : "✓"} ${p.name} ${installed} (pin ${p.pin})`;
          });
          ctx?.ui?.notify?.(lines.join("\n") + "\n(see `omp plugin doctor` for deep checks)", "info");
          return;
        }

        ctx?.ui?.notify?.(
          `/xdev: unknown argument "${cmd}". Commands: status|check|upgrade [names]|doctor [--dry-run]`,
          "warning",
        );
      } catch (e) {
        ctx?.ui?.notify?.(`xdev error: ${String(e?.message ?? e)}`, "error");
      }
    },
  });
}