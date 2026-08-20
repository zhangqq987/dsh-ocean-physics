import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'

export function registerDensityTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'ocean_potential_density',
    description: 'Ocean physics tool: input in-situ temperature (C ITS-90), practical salinity (SP PSU), pressure (dbar); returns potential density sigma0 (kg/m^3) via python gsw.',
    parameters: {
      temperature: { type: 'number', required: true, description: 'in-situ temperature C' },
      salinity: { type: 'number', required: true, description: 'practical salinity SP / PSU' },
      pressure: { type: 'number', required: true, description: 'pressure dbar' },
    },
    output: { schema: { type: 'string' } },
    async execute(args) {
      const out = execSync(
        `python -c "import gsw; sp=${args.salinity}; t=${args.temperature}; p=${args.pressure}; SA=gsw.SA_from_SP(sp,p,0,0); CT=gsw.CT_from_t(SA,t,p); print(gsw.sigma0(SA,CT))"`,
        { encoding: 'utf8' }
      )
      return String(Number(out.trim()))
    },
  }))
}