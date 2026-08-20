import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function registerCopernicusMarineTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'query_copernicus_marine',
    description: 'Download ocean data (temperature, salinity, currents) from Copernicus Marine Service via copernicusmarine Python package. Requires ~/.copernicusmarine credentials.',
    parameters: {
      datasetId: { type: 'string', required: true, description: 'Copernicus dataset ID, e.g. cmems_mod_glo_phy-thetao_0.083deg_P1D-m' },
      variables: { type: 'string', required: true, description: 'Comma-separated variable names, e.g. thetao,so' },
      north: { type: 'number', required: true, description: 'Northern bound' },
      south: { type: 'number', required: true, description: 'Southern bound' },
      east: { type: 'number', required: true, description: 'Eastern bound' },
      west: { type: 'number', required: true, description: 'Western bound' },
      startDate: { type: 'string', required: true, description: 'YYYY-MM-DD' },
      endDate: { type: 'string', required: true, description: 'YYYY-MM-DD' },
      outputName: { type: 'string', required: true, description: 'Output NetCDF filename' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const vars = args.variables.split(',').map((v: string) => v.trim())
      const code = `
import copernicusmarine
import xarray as xr

ds = copernicusmarine.open_dataset(
    dataset_id="${args.datasetId}",
    variables=${JSON.stringify(vars)},
    minimum_longitude=${args.west},
    maximum_longitude=${args.east},
    minimum_latitude=${args.south},
    maximum_latitude=${args.north},
    start_datetime="${args.startDate}T00:00:00",
    end_datetime="${args.endDate}T23:59:59",
)
ds.to_netcdf("${join(artifactDir, args.outputName)}")
print("Downloaded:", list(ds.data_vars))
`

      const scriptPath = join(artifactDir, 'fetch_copernicus.py')
      writeFileSync(scriptPath, code, 'utf8')

      return `Copernicus Marine download script written to ${scriptPath}. Run: python ${scriptPath}\n\nRequires: pip install copernicusmarine and ~/.copernicusmarine credentials configured.`
    },
  }))
}