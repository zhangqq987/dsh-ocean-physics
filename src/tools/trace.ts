
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function registerTraceTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'generate_figure_with_trace',
    description: 'Generate a figure from Python code and save the code to artifacts/ for reproducibility. Returns the figure path.',
    parameters: {
      pythonCode: { type: 'string', description: 'Full Python script that creates and saves a figure' },
      figureName: { type: 'string', description: 'Filename for the figure, e.g. mld_vs_wind.png' }
    },
    output: 'string',
    async execute(args) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const scriptPath = join(artifactDir, figureName.replace('.png', '') + '.py')
      writeFileSync(scriptPath, args.pythonCode, 'utf8')

      const figPath = join(artifactDir, args.figureName)
      const codeToRun = args.pythonCode + `\nimport matplotlib.pyplot as plt\nplt.savefig('${figPath}', dpi=150, bbox_inches='tight')`
      writeFileSync(scriptPath, codeToRun, 'utf8')

      try {
        execSync(`python "${scriptPath}"`, { encoding: 'utf8' })
      } catch (e) {
        return 'Error: ' + String(e)
      }

      const manifestPath = join(artifactDir, 'manifest.json')
      const manifest = existsSync(manifestPath) ? JSON.parse(require('node:fs').readFileSync(manifestPath, 'utf8')) : []
      manifest.push({ figure: args.figureName, code: scriptPath, time: new Date().toISOString() })
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

      return figPath
    },
  }))
}
