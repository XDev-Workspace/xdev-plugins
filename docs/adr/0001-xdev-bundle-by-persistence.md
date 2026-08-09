# ADR-0001: xdev bundles plugins by driving their native persistence surfaces, not by wrapping them

- Status: superseded by ADR-0002
- Date: 2026-08-09 (superseded 2026-08-09)

## Context

Early xdev design considered batched mode control (caveman level, ponytail
level, rtk on/off) on third-party constituent plugins with closed internals.
Reference implementation (`oh-my-pi-supreme-token-saver`) controls plugins
it bundles itself; xdev's constituents are separate npm packages.

## Decision (superseded)

xdev would write the same persistence surfaces each constituent reads
(config files + pi session entries) and rely on restart/reload for adoption.

## Why superseded

Mode control proved a treadmill of constituent-specific quirks: each plugin
caches its own state at module load, re-reads configs at different
boundaries, and exposes no programmatic setter. Writing config files did not
update live state; reload did not re-fire `session_start`; session entries
only applied on restart; status displays read different sources of truth.
Keeping that working meant per-constituent forks — exactly what ADR-0001
was supposed to avoid.

See ADR-0002 for the replacement.

## Consequences

Superseded. All mode-related code (config writers, session entries, mode
readouts) was removed in 0.2.0.