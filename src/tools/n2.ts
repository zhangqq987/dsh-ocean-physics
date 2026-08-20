
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'

export function registerN2Tool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'ocean_compute_N2',
    description: 'Physical oceanography tool: compute Brunt-Vaisala frequency squared (N2) from pressure (dbar), absolute salinity (g/kg), and conservative temperature (degC). Uses gsw.Nsquared. Returns JSON array of {pressure, N2}.',
    parameters: {
      pressure: { type: 'array', required: true, description: 'Array of pressure values in dbar' },
      SA: { type: 'array', required: true, description: 'Array of absolute salinity in g/kg, same length as pressure' },
      CT: { type: 'array', required: true, description: 'Array of conservative temperature in degC, same length as pressure' },
      latitude: { type: 'number', description: 'Latitude in degrees (default 0)' }
    },
    output: 'string',
    async execute(args) {
      const p = JSON.stringify(args.pressure)
      const sa = JSON.stringify(args.SA)
      const ct = JSON.stringify(args.CT)
      const lat = args.latitude ?? 0
      const cmd = `python -c "import gsw, json; p=json.loads('${p}'); SA=json.loads('${sa}'); CT=json.loads('${ct}'); N2, p_mid = gsw.Nsquared(SA, CT, p, ${lat}); print(json.dumps([{'pressure': float(p_mid[i]), 'N2': float(N2[i])} for i in range(len(N2))]))"`
      const out = execSync(cmd, { encoding: 'utf8' })
      return out.trim()
    },
  }))
}
