\# Claude Science Parity



Reference: Anthropic Claude Science beta (2026-06-30)

Plugin: dsh-ocean-physics v1.0

Date: 2026-08-20



\## What's replicated (plugin-layer: 100%)



| Capability | Implementation |

|------------|---------------|

| Domain skills + data connectors | 12 ocean Skills + 5 data sources (WOD/Argo/ERA5/NCEP/Copernicus) |

| Auditable artifacts | Code + env + chat + manifest per figure |

| Persistent reviewer | Inline audit log + DOI HEAD check + auto-rerun on missing |

| Natural-language figure editing | edit\_figure: read old .py, append, re-run, new hash |

| Own compute (local / HPC / Modal) | All Python local; SLURM + Modal script generation |

| Session fork + research state | fork\_research\_session + research-manifest.json |

| Paper draft from state | paper-draft skill, JGR format, no fabrication |



\## Not reachable at plugin layer (platform/framework/commercial)



\- Native 3D protein/genome rendering (desktop app UI)

\- Multi-agent runtime (coordinator spawning specialists)

\- BioNeimo models (Evo2, Boltz-2, OpenFold3)

\- Live Modal execution / SSH-HPC submit (account + network)



\## Verified working 2026-08-20



\- generate\_figure\_with\_trace\_v2: figure + code + env + manifest

\- edit\_figure: read old code, append xlabel/ylabel/title, re-run, new hash

\- audit\_deep: DOI 10.1038/nature12345 returns HTTP 302 (valid)

\- compute\_stats: Pearson r=0.85, p=0.066, bootstrap CI

\- paper-draft: JGR format, honest placeholders, no data fabrication

\- export\_session\_report: Markdown with hypotheses/datasets/claims/audit

\- coordinate\_research: 7-step plan, auto-loads wind-mld-correlation skill

