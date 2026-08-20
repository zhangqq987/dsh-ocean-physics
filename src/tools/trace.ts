import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

function ensureArtifacts() {
  if (!existsSync('artifacts')) mkdirSync('artifacts', { recursive: true })
}

function hashFile(path: string): string {
  if (!existsSync(path)) return 'missing'
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16)
}

export function registerTraceTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'generate_figure_with_trace',
    description: 'Generate a figure with full audit: code + env + description + chat context + auto-review.',
    parameters: {
      pythonCode: { type: 'string', required: true, description: 'Full Python script' },
      figureName: { type: 'string', required: true, description: 'Output filename, e.g. mld_vs_wind.png' },
      description: { type: 'string', required: false, description: 'Plain-language description of what this figure shows' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      ensureArtifacts()

      // 读取最近对话历史（从 ctx 的 messages 里拿，如果有的话）
      let chatContext = 'N/A'
      try {
        const historyPath = 'artifacts/chat_history.jsonl'
        if (existsSync(historyPath)) {
          const lines = readFileSync(historyPath, 'utf8').trim().split('\n').filter(Boolean)
          chatContext = lines.slice(-5).map((l: string) => {
            try { return JSON.parse(l).content?.slice(0, 80) || '' } catch { return '' }
          }).filter(Boolean).join(' | ')
        }
      } catch {}

      const figureRel = 'artifacts/' + args.figureName
      const codePath = join('artifacts', args.figureName.replace(/\.png$/, '.py'))
      const codeToRun = args.pythonCode + `\nimport matplotlib.pyplot as plt\nplt.savefig('${figureRel}', dpi=150, bbox_inches='tight')`
      writeFileSync(codePath, codeToRun, 'utf8')

      let envSnapshot = 'N/A'
      try {
        envSnapshot = execSync('pip list --format=freeze', { encoding: 'utf8' })
        writeFileSync(join('artifacts', 'env.txt'), envSnapshot, 'utf8')
      } catch {}

      try {
        execSync(`python "${codePath}"`, { encoding: 'utf8' })
      } catch (e: any) {
        return 'Error: ' + String(e)
      }

      const figHash = hashFile(figureRel)
      const codeHash = hashFile(codePath)
      const reviewEntry = {
        time: new Date().toISOString(),
        tool: 'generate_figure_with_trace',
        ok: figHash !== 'missing',
        auto_corrected: false,
        description: args.description || 'no description',
        chat_context: chatContext,
        checks: ['figure_hash=' + figHash, 'code_hash=' + codeHash, figHash === 'missing' ? 'ERROR' : 'OK'],
      }
      appendFileSync('artifacts/review_log.jsonl', JSON.stringify(reviewEntry) + '\n')

      // 同时写 manifest.json（完整审计工件）
      const manifestPath = 'artifacts/manifest.json'
      const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : []
      manifest.push({
        figure: args.figureName,
        code: codePath,
        env: 'artifacts/env.txt',
        description: args.description || '',
        chat_context: chatContext,
        time: new Date().toISOString(),
      })
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

      return `Figure saved to ${figureRel}\nCode: ${codePath}\nDescription: ${args.description || 'none'}\nChat context: ${chatContext}\nAudit: figure_hash=${figHash}, code_hash=${codeHash}`
    },
  }))
}
