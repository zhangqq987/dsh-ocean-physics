
import type { Context } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# Brunt-Vaisala Frequency (N2) Compute Skill

When user asks to compute stratification (Brunt-Vaisala frequency squared, N2) from a CTD profile, use this skill.

## Prerequisites
- Pressure profile (dbar)
- Absolute salinity SA (g/kg) and conservative temperature CT (degC)
- If raw data is practical salinity SP and in-situ temp t, convert first: gsw.SA_from_SP, gsw.CT_from_t

## Tool call
Use ocean_compute_N2 with:
- pressure: array of dbar values
- SA: array of g/kg
- CT: array of degC
- latitude: optional (default 0)

## Interpretation
- N2 > 0: stable stratification
- N2 < 0: unstable (convection possible)
- Max N2 at pycnocline
- N2 unit: rad^2/s^2; N = sqrt(N2) gives buoyancy frequency

## Notes
- gsw.Nsquared returns N2 and p_mid (mid-pressure, length = len(p)-1)
- Latitude has minimal effect on N2 (only through small g variation)
`.trim()

export function registerN2Skill(ctx: Context) {
  ctx.skills?.register({
    name: 'n2-compute',
    description: 'Compute Brunt-Vaisala frequency squared (N2) from CTD profile',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}
