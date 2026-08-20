import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'

export function registerDensityTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'ocean_potential_density',
    description: 'Compute potential density anomaly sigma0 (kg/m^3) from salinity and temperature using gsw.',
    parameters: {
      salinity: { type: 'number', required: true, description: 'Absolute salinity SA (g/kg)' },
      temperature: { type: 'number', required: true, description: 'Conservative temperature CT (deg C)' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const code = `import gsw; print(gsw.sigma0(${args.salinity}, ${args.temperature}))`
      try {
        const out = execSync(`python -c "${code}"`, { encoding: 'utf8' })
        return 'sigma0 = ' + out.trim() + ' kg/m^3'
      } catch (e) {
        return 'Error: ' + String(e)
      }
    },
  }))
}