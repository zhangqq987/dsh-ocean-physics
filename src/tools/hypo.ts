import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

export function registerHypothesisTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'log_hypothesis',
    description: 'Log a research hypothesis.',
    parameters: {
      hypothesisId: { type: 'string', required: true, description: 'ID like H1' },
      content: { type: 'string', required: true, description: 'Hypothesis text' },
      evidence: { type: 'string', description: 'Evidence file path' }
    },
    output: { schema: { type: 'string' } },
    async execute(args) {
      const p = 'research-manifest.json'
      const m = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { hypotheses: [] }
      m.hypotheses.push({ id: args.hypothesisId, content: args.content, evidence: args.evidence || null, status: 'testing', time: new Date().toISOString() })
      writeFileSync(p, JSON.stringify(m, null, 2), 'utf8')
      return 'Hypothesis ' + args.hypothesisId + ' logged.'
    },
  }))
}