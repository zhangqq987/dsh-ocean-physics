import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { existsSync, readFileSync } from 'node:fs'

export function registerViewReviewLogTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'view_audit_log',
    description: 'View the last N entries of the auto-review audit log.',
    parameters: {
      last: { type: 'number', description: 'Number of recent entries to show (default 10)' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const logPath = 'artifacts/review_log.jsonl'
      if (!existsSync(logPath)) return 'No audit log yet.'
      const lines = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean)
      const n = (args.last && args.last > 0) ? args.last : 10
      const recent = lines.slice(-n).map((l: string, i: number) => {
        const e = JSON.parse(l)
        return `#${lines.length - n + i} [${e.time}] ${e.tool}: ${e.ok ? 'OK' : 'FAIL'} | ${(e.checks || []).join(' | ')}`
      })
      return recent.join('\n')
    },
  }))
}
