import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function registerSectionTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'plotly_section',
    description: 'Generate an interactive depth-section plot (temperature/salinity vs distance) using plotly and save as HTML.',
    parameters: {
      dataPath: { type: 'string', required: true, description: 'Path to NetCDF file with variables lon, lat, pressure, temperature, salinity' },
      varName: { type: 'string', required: true, description: 'Variable to plot: temperature or salinity' },
      outputName: { type: 'string', required: true, description: 'Output HTML filename, e.g. section_temp.html' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const code = `
import netCDF4 as nc
import numpy as np
import plotly.graph_objects as go
from scipy.interpolate import griddata

ds = nc.Dataset('${args.dataPath}')
lons = ds.variables['lon'][:]
lats = ds.variables['lat'][:]
p = ds.variables['pressure'][:]
t = ds.variables['temperature'][:]
s = ds.variables['salinity'][:]
ds.close()

# Compute cumulative distance along track
dist = np.zeros(len(lons))
for i in range(1, len(lons)):
    dist[i] = dist[i-1] + np.sqrt((lons[i]-lons[i-1])**2 + (lats[i]-lats[i-1])**2) * 111.0

# Grid to regular section
p_grid = np.linspace(p.min(), p.max(), 100)
d_grid = np.linspace(dist.min(), dist.max(), 200)
P, D = np.meshgrid(p_grid, d_grid)

if '${args.varName}' == 'temperature':
    vals = t
    title = 'Temperature Section (°C)'
    colorbar = '°C'
else:
    vals = s
    title = 'Salinity Section (g/kg)'
    colorbar = 'g/kg'

V = griddata((p.flatten(), dist.flatten()), vals.flatten(), (P.flatten(), D.flatten()), method='linear')
V = V.reshape(P.shape)

fig = go.Figure(data=go.Heatmap(
    x=D[0], y=-P[:,0], z=V, colorscale='viridis', colorbar=dict(title=colorbar)
))
fig.update_layout(title=title, xaxis_title='Distance (km)', yaxis_title='Depth (m)', template='plotly_white')
fig.write_html('${join(artifactDir, args.outputName)}')
print('OK')
`

      const scriptPath = join(artifactDir, args.outputName.replace('.html', '.py'))
      writeFileSync(scriptPath, code, 'utf8')

      try {
        const { execSync } = require('node:child_process')
        execSync(`python "${scriptPath}"`, { encoding: 'utf8' })
        return `Interactive section plot saved to ${join(artifactDir, args.outputName)}. Code: ${scriptPath}`
      } catch (e) {
        return 'Error: ' + String(e) + '\nMake sure plotly and scipy are installed: pip install plotly scipy netCDF4'
      }
    },
  }))
}