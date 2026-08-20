import type { Context } from '@deepseek-ai/cordis'
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const REVIEW_LOG = 'artifacts/review_log.jsonl'
const LAST_FIGURE_ARGS = 'artifacts/.last_figure_args.json'

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
    if (e.tool === 'generate_figure_with_trace' && e.ok !== false) {
      try { writeFileSync(LAST_FIGURE_ARGS, JSON.stringify(e.args || {})) } catch {}
    }
  })

  ctx.on('tool/result', (e: any) => {
    ensureDir()
    const entry: any = {
      time: new Date().toISOString(),
      tool: e.tool || 'unknown',
      ok: true,
      auto_corrected: false,
      checks: [] as string[],
    }

    if (e.tool === 'generate_figure_with_trace') {
      try {
        const args = e.args || {}
        const figurePath = 'artifacts/' + (args.figureName || 'unknown.png')
        const codePath = 'artifacts/' + (args.figureName || 'unknown').replace(/\.png$/, '.py')
        const figHash = hashFile(figurePath)
        const codeHash = hashFile(codePath)
        entry.checks.push('figure_hash=' + figHash)
        entry.checks.push('code_hash=' + codeHash)
        if (figHash === 'missing') {
          entry.ok = false
          entry.checks.push('ERROR: figure missing -> auto-rerun')
          entry.auto_corrected = true
          try {
            const lastArgs = JSON.parse(readFileSync(LAST_FIGURE_ARGS, 'utf8'))
            ctx.tools.call('generate_figure_with_trace', lastArgs).then((result: any) => {
              appendFileSync(REVIEW_LOG, JSON.stringify({
                time: new Date().toISOString(),
                tool: 'reviewer_hook',
                ok: true,
                auto_corrected: true,
                checks: ['AUTO-RERUN: figure regenerated', 'result=' + String(result).slice(0, 80)],
              }) + '\n')
            }).catch((err: any) => {
              appendFileSync(REVIEW_LOG, JSON.stringify({
                time: new Date().toISOString(),
                tool: 'reviewer_hook',
                ok: false,
                auto_corrected: true,
                checks: ['AUTO-RERUN-FAILED: ' + err.message],
              }) + '\n')
            })
          } catch (err: any) {
            entry.checks.push('AUTO-RERUN-FAILED: ' + err.message)
          }
        }
      } catch (err: any) {
        entry.ok = false
        entry.checks.push('ERROR: ' + err.message)
      }
    }

    if (e.tool === 'ocean_compute_N2') {
      const hasN2 = /N2\s*=\s*\[?-?[\d.]+/.test(String(e.output || ''))
      entry.checks.push('n2_has_value=' + hasN2)
      if (!hasN2) { entry.ok = false; entry.checks.push('WARNING: no N2 value') }
    }

    appendFileSync(REVIEW_LOG, JSON.stringify(entry) + '\n')
  })
}
