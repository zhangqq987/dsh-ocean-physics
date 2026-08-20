import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function registerTraceV2Tool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'generate_figure_with_trace_v2',
    description: 'Generate a figure with FULL audit: code + env + natural-language description + manifest entry.',
    parameters: {
      pythonCode: { type: 'string', required: true, description: 'Full Python script' },
      figureName: { type: 'string', required: true, description: 'Output filename, e.g. mld_vs_wind.png' },
      description: { type: 'string', required: true, description: 'Plain-language description of what this figure shows and how it was produced' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const artifactDir = 'artifacts'
      if (!existsSync(artifactDir)) mkdirSync(artifactDir, { recursive: true })

      const scriptPath = join(artifactDir, args.figureName.replace(/\.\w+$/, '') + '.py')
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
      } catch {}

      try {
        execSync(`python "${scriptPath}"`, { encoding: 'utf8' })
      } catch (e: any) {
        return 'Error: ' + String(e)
      }

      // 写 manifest（含自然语言说明）
      const manifestPath = join(artifactDir, 'manifest.json')
      const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : []
      manifest.push({
        figure: args.figureName,
        code: scriptPath,
        env: join(artifactDir, 'env.txt'),
        description: args.description,
        time: new Date().toISOString(),
      })
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

      return `Figure: ${args.figureName}\nDescription: ${args.description}\nCode: ${scriptPath}\nEnv: artifacts/env.txt\nManifest updated.`
    },
  }))
}