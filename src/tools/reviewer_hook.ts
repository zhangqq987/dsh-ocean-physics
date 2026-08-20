import type { Context } from '@deepseek-ai/cordis'
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const REVIEW_LOG = 'artifacts/review_log.jsonl'

function ensureDir() {
  if (!existsSync('artifacts')) mkdirSync('artifacts', { recursive: true })
}

function hashFile(path: string): string {
  if (!existsSync(path)) return 'missing'
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16)
}

export function registerReviewerHook(ctx: Context) {
  ctx.on('tool/result', (e: any) => {
    ensureDir()
    const entry: any = {
      time: new Date().toISOString(),
      tool: e.tool || 'unknown',
      ok: true,
      checks: [] as string[],
    }

    if (e.tool === 'generate_figure_with_trace') {
      try {
        const args = e.args || {}
        const figurePath = 'artifacts/' + (args.figureName || 'unknown.png')
        const codePath = 'artifacts/' + (args.figureName || 'unknown').replace(/\.png$/, '.py')
        entry.checks.push('figure_hash=' + hashFile(figurePath))
        entry.checks.push('code_hash=' + hashFile(codePath))
        if (hashFile(figurePath) === 'missing') { entry.ok = false; entry.checks.push('ERROR: figure missing') }
        if (hashFile(codePath) === 'missing') { entry.ok = false; entry.checks.push('ERROR: code missing') }
      } catch (err: any) {
        entry.ok = false
        entry.checks.push('ERROR: ' + err.message)
      }
    }

    if (e.tool === 'ocean_compute_N2') {
      const hasN2 = /N2\s*=\s*\[?-?[\d.]+/.test(String(e.output || ''))
      entry.checks.push('n2_output_has_value=' + hasN2)
      if (!hasN2) { entry.ok = false; entry.checks.push('WARNING: no N2 value') }
    }

    appendFileSync(REVIEW_LOG, JSON.stringify(entry) + '\n')
  })
}
