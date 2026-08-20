import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'

export function registerN2Tool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'ocean_compute_N2',
    description: 'Compute Brunt-Vaisala frequency squared (N2, 1/s^2) from CTD profile using gsw.',
    parameters: {
      salinity: { type: 'string', required: true, description: 'Comma-separated SA values, e.g. 35.0,35.1,35.2' },
      temperature: { type: 'string', required: true, description: 'Comma-separated CT values, e.g. 10.0,9.5,9.0' },
      pressure: { type: 'string', required: true, description: 'Comma-separated pressure values (dbar), e.g. 10,20,30' },
      latitude: { type: 'number', required: true, description: 'Latitude of observation (degrees)' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const code = `import gsw, numpy as np; SA=np.array([${args.salinity}]); CT=np.array([${args.temperature}]); p=np.array([${args.pressure}]); N2,__=gsw.Nsquared(SA,CT,p,${args.latitude}); print(N2.tolist())`
      try {
        const out = execSync(`python -c "${code}"`, { encoding: 'utf8' })
        return 'N2 = ' + out.trim() + ' 1/s^2'
      } catch (e) {
        return 'Error: ' + String(e)
      }
    },
  }))
}