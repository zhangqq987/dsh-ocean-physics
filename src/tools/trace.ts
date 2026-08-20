import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function registerTraceTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'generate_figure_with_trace',
    description: 'Generate a figure from Python code, save the code and environment snapshot for full reproducibility.',
    parameters: {
      pythonCode: { type: 'string', required: true, description: 'Full Python script that creates and saves a figure' },
      figureName: { type: 'string', required: true, description: 'Filename for the figure, e.g. mld_vs_wind.png' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const scriptPath = join(artifactDir, args.figureName.replace('.png', '') + '.py')
      // Use forward slashes: join() yields backslash paths on Windows, and a raw
      // backslash in a Python string literal parses as an escape (e.g. \t in
      // 'artifacts\test_auto.png' -> TAB), which Windows rejects as a filename.
      const figureRel = join(artifactDir, args.figureName).replace(/\\/g, '/')
      const codeToRun = args.pythonCode + `\nimport matplotlib.pyplot as plt\nplt.savefig('${figureRel}', dpi=150, bbox_inches='tight')`
      writeFileSync(scriptPath, codeToRun, 'utf8')

      let envSnapshot = 'N/A'
      try {
        envSnapshot = execSync('pip list --format=freeze', { encoding: 'utf8' })
        writeFileSync(join(artifactDir, 'env.txt'), envSnapshot, 'utf8')
      } catch (e) {
        envSnapshot = 'Failed to capture: ' + String(e)
      }

      try {
        execSync(`python "${scriptPath}"`, { encoding: 'utf8' })
      } catch (e) {
        return 'Error running script: ' + String(e)
      }

      const manifestPath = join(artifactDir, 'manifest.json')
      const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : []
      manifest.push({ figure: args.figureName, code: scriptPath, env: join(artifactDir, 'env.txt'), time: new Date().toISOString() })
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

      return `Figure saved to ${join(artifactDir, args.figureName)}. Code: ${scriptPath}. Env: artifacts/env.txt`
    },
  }))
}