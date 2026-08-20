import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function registerNcepWindTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'query_ncep_wind',
    description: 'Download NCEP/NCAR Reanalysis 10m wind (u + v) via NOAA OPeNDAP. Free, no auth needed.',
    parameters: {
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

      const code = `
import xarray as xr
import numpy as np

# NCEP Reanalysis OPeNDAP endpoints
u_url = 'https://psl.noaa.gov/thredds/dodsC/Datasets/ncep.reanalysis/surface/uwnd.10m.mon.mean.nc'
v_url = 'https://psl.noaa.gov/thredds/dodsC/Datasets/ncep.reanalysis/surface/vwnd.10m.mon.mean.nc'

ds_u = xr.open_dataset(u_url).sel(time=slice('${args.startDate}', '${args.endDate}'), lat=slice(${args.north}, ${args.south}), lon=slice(${args.west}, ${args.east}))
ds_v = xr.open_dataset(v_url).sel(time=slice('${args.startDate}', '${args.endDate}'), lat=slice(${args.north}, ${args.south}), lon=slice(${args.west}, ${args.east}))

# Compute wind speed
u = ds_u['uwnd']
v = ds_v['vwnd']
wind_speed = np.sqrt(u**2 + v**2)

# Save
ds_out = xr.Dataset({'wind_speed': wind_speed, 'uwnd': u, 'vwnd': v})
ds_out.to_netcdf('${join(artifactDir, args.outputName)}')
print('NCEP wind saved. Shape:', wind_speed.shape)
`

      const scriptPath = join(artifactDir, 'fetch_ncep_wind.py')
      writeFileSync(scriptPath, code, 'utf8')

      return `NCEP wind fetch script written to ${scriptPath}. Run: python ${scriptPath}\n\nFree, no auth required. Uses NOAA PSL OPeNDAP.`
    },
  }))
}