import type { Context } from '@deepseek-ai/cordis'
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const REVIEW_LOG = 'artifacts/review_log.jsonl'

function ensureDir() {
  if (!existsSync('artifacts')) mkdirSync('artifacts', { recursive: true })
}

function hashFile(path: string): string {
  if (!existsSync(path)) return 'missing'
  const content = readFileSync(path)
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function hashString(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16)
}

export function registerReviewerHook(ctx: Context) {
  // 监听所有 tool 结果事件
  ctx.on('tool/result', (e: any) => {
    ensureDir()
    const entry: any = {
      time: new Date().toISOString(),
      tool: e.tool || 'unknown',
      ok: true,
      checks: [] as string[],
    }

    // 出图后：比对图文件和代码文件的 hash
    if (e.tool === 'generate_figure_with_trace') {
      try {
        const args = e.args || {}
        const figurePath = join('artifacts', args.figureName || 'unknown.png')
        const codePath = join('artifacts', (args.figureName || 'unknown').replace(/\.png$/, '.py'))

        const figHash = hashFile(figurePath)
        const codeHash = hashFile(codePath)

        entry.checks.push(`figure_hash=${figHash}`)
        entry.checks.push(`code_hash=${codeHash}`)

        if (figHash === 'missing') {
          entry.ok = false
          entry.checks.push('ERROR: figure file missing')
        }
        if (codeHash === 'missing') {
          entry.ok = false
          entry.checks.push('ERROR: code file missing')
        }
      } catch (err: any) {
        entry.ok = false
        entry.checks.push(`ERROR: ${err.message}`)
      }
    }

    // N² 计算后：检查返回字符串里有没有 N2 数值
    if (e.tool === 'ocean_compute_N2') {
      const output = String(e.output || '')
      const hasN2 = /N2\s*=\s*\[?-?[\d.]+/.test(output)
      entry.checks.push(`n2_output_has_value=${hasN2}`)
      if (!hasN2) {
        entry.ok = false
        entry.checks.push('WARNING: N2 output may not contain numeric result')
      }
    }

    // 假设记录后：检查 manifest 里 hypotheses 数组非空
    if (e.tool === 'log_hypothesis') {
      try {
        const manifestPath = 'research-manifest.json'
        if (existsSync(manifestPath)) {
          const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
          const count = (m.hypotheses || []).length
          entry.checks.push(`hypotheses_count=${count}`)
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

    // 文献查询后：检查返回里有没有 DOI 格式
    if (e.tool === 'lit-search') {
      const output = String(e.output || '')
      const doiCount = (output.match(/10\.\d{4,}\/[^\s,]+/g) || []).length
      entry.checks.push(`doi_count=${doiCount}`)
      if (doiCount === 0) {
        entry.ok = false
        entry.checks.push('WARNING: no DOI found in output')
      }
    }

    appendFileSync(REVIEW_LOG, JSON.stringify(entry) + '\n')
  })

  // 提供一个手动查看日志的 Tool
  ctx.tools.register({
    name: 'view_review_log',
    description: 'View the last N entries of the auto-review log.',
    parameters: {
      last: { type: 'number', description: 'Number of recent entries to show (default 10)' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      ensureDir()
      if (!existsSync(REVIEW_LOG)) return 'No review log yet.'
      const lines = readFileSync(REVIEW_LOG, 'utf8').trim().split('\n')
      const n = args.last || 10
      const recent = lines.slice(-n).map((l: string, i: number) => {
        const e = JSON.parse(l)
        return `#${lines.length - n + i} [${e.time}] ${e.tool}: ${e.ok ? 'OK' : 'FAIL'} | ${e.checks.join(' | ')}`
      })
      return recent.join('\n')
    },
  } as any)
}