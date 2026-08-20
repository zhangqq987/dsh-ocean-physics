import type { Context } from '@deepseek-ai/cordis'
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
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
  // 保存最近一次出图的参数（供自纠时重跑）
  ctx.on('tool/result', (e: any) => {
    ensureDir()

    // 记录最近一次出图参数
    if (e.tool === 'generate_figure_with_trace' && e.ok !== false) {
      try {
        writeFileSync(LAST_FIGURE_ARGS, JSON.stringify(e.args || {}))
      } catch {}
    }
  })

  // 主 hook：每次 tool 返回后审计
  ctx.on('tool/result', (e: any) => {
    ensureDir()
    const entry: any = {
      time: new Date().toISOString(),
      tool: e.tool || 'unknown',
      ok: true,
      auto_corrected: false,
      checks: [] as string[],
    }

    // === 出图审计 ===
    if (e.tool === 'generate_figure_with_trace') {
      try {
        const args = e.args || {}
        const figurePath = 'artifacts/' + (args.figureName || 'unknown.png')
        const codePath = 'artifacts/' + (args.figureName || 'unknown').replace(/\.png$/, '.py')

        const figHash = hashFile(figurePath)
        const codeHash = hashFile(codePath)
        entry.checks.push('figure_hash=' + figHash)
        entry.checks.push('code_hash=' + codeHash)

        // 自纠：图文件不存在 → 重跑
        if (figHash === 'missing') {
          entry.ok = false
          entry.checks.push('ERROR: figure missing → auto-rerun')
          entry.auto_corrected = true
          try {
            const lastArgs = JSON.parse(readFileSync(LAST_FIGURE_ARGS, 'utf8'))
            // 通过 ctx 重新触发 generate_figure_with_trace
            ctx.tools.call('generate_figure_with_trace', lastArgs).then((result: any) => {
              appendFileSync(REVIEW_LOG, JSON.stringify({
                time: new Date().toISOString(),
                tool: 'reviewer_hook',
                ok: true,
                auto_corrected: true,
                checks: ['AUTO-RERUN: figure regenerated after missing detection', 'result=' + String(result).slice(0, 100)],
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

        // 自纠：代码和图 hash 不同 → 代码改了但图没更新
        if (figHash !== 'missing' && codeHash !== 'missing' && figHash === codeHash) {
          // 如果代码和图 hash 一样，说明图是用旧代码生成的（不太可能，但记录）
          entry.checks.push('NOTE: code and figure hashes identical (may be expected)')
        }
      } catch (err: any) {
        entry.ok = false
        entry.checks.push('ERROR: ' + err.message)
      }
    }

    // === N² 审计 ===
    if (e.tool === 'ocean_compute_N2') {
      const output = String(e.output || '')
      const hasN2 = /N2\s*=\s*\[?-?[\d.]+/.test(output)
      entry.checks.push('n2_output_has_value=' + hasN2)
      if (!hasN2) {
        entry.ok = false
        entry.checks.push('WARNING: no N2 value → recommend re-check inputs')
        // 自纠：记录建议，不自动重跑（因为 N² 需要输入参数，无法从上下文恢复）
        entry.auto_corrected = false
      }
    }

    // === 假设审计 ===
    if (e.tool === 'log_hypothesis') {
      try {
        const manifestPath = 'research-manifest.json'
        if (existsSync(manifestPath)) {
          const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
          const count = (m.hypotheses || []).length
          entry.checks.push('hypotheses_count=' + count)
          if (count === 0) {
            entry.ok = false
            entry.checks.push('WARNING: no hypotheses in manifest')
          }
        }
      } catch {
        entry.ok = false
        entry.checks.push('ERROR: cannot read manifest')
      }
    }

    appendFileSync(REVIEW_LOG, JSON.stringify(entry) + '\n')
  })
}
