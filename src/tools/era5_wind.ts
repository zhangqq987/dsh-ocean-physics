import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function registerEra5WindTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'query_era5_wind',
    description: 'Query ERA5 daily mean wind speed (u10, v10) from Copernicus CDS API for a given bounding box and date range. Returns a NetCDF file path.',
    parameters: {
      north: { type: 'number', required: true, description: 'Northern latitude bound' },
      south: { type: 'number', required: true, description: 'Southern latitude bound' },
      east: { type: 'number', required: true, description: 'Eastern longitude bound' },
      west: { type: 'number', required: true, description: 'Western longitude bound' },
      startDate: { type: 'string', required: true, description: 'Start date YYYY-MM-DD' },
      endDate: { type: 'string', required: true, description: 'End date YYYY-MM-DD' },
      outputName: { type: 'string', required: true, description: 'Output NetCDF filename, e.g. era5_wind_yellow_sea.nc' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const code = `
import cdsapi
import os

c = cdsapi.Client()

c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'variable': ['10m_u_component_of_wind', '10m_v_component_of_wind'],
        'year': [str(y) for y in range(${args.startDate.split('-')[0]}, ${args.endDate.split('-')[0]}+1)],
        'month': [f'{m:02d}' for m in range(1, 13)],
        'day': [f'{d:02d}' for d in range(1, 32)],
        'time': '00:00',
        'area': [${args.north}, ${args.west}, ${args.south}, ${args.east}],
        'format': 'netcdf',
    },
    '${join(artifactDir, args.outputName)}'
)
print('ERA5 wind data saved to ${join(artifactDir, args.outputName)}')
`

      const scriptPath = join(artifactDir, 'fetch_era5_wind.py')
      writeFileSync(scriptPath, code, 'utf8')

      return `ERA5 wind fetch script written to ${scriptPath}. Run manually: python ${scriptPath}\n\nRequires: pip install cdsapi and a valid ~/.cdsapirc file from https://cds.climate.copernicus.eu/`
    },
  }))
}