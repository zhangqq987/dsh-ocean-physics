import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export function registerReviewerTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'review_session',
    description: 'Audit artifacts: check figure-code consistency and verify DOIs. Returns a review report.',
    parameters: {
      doiList: { type: 'string', description: 'Comma-separated DOIs to verify, e.g. 10.1038/nature12345,10.1000/xyz' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const artifactDir = 'artifacts'
      const manifestPath = join(artifactDir, 'manifest.json')
      let report = '# Reviewer Report\n\n'

      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
        report += '## Figure Traceability\n'
        for (const item of manifest) {
          const codeExists = existsSync(item.code)
          const figExists = existsSync(join(artifactDir, item.figure))
          report += codeExists && figExists
            ? `- [OK] ${item.figure}\n`
            : `- [FAIL] ${item.figure}: code=${codeExists}, figure=${figExists}\n`
        }
      } else {
        report += '## Figure Traceability\nNo manifest.json found.\n'
      }

      report += '\n## DOI Verification\n'
      const dois = args.doiList ? args.doiList.split(',').map((d: string) => d.trim()) : []
      if (dois.length === 0) {
        report += 'No DOIs provided.\n'
      } else {
        for (const doi of dois) {
          try {
            const res = await fetch('https://doi.org/' + doi, { method: 'HEAD' })
            report += `- [${res.status === 200 ? 'OK' : 'FAIL'}] ${doi} (HTTP ${res.status})\n`
          } catch {
            report += `- [FAIL] ${doi} (network error)\n`
          }
        }
      }

      if (!existsSync(artifactDir)) { require('node:fs').mkdirSync(artifactDir, { recursive: true }) }
      const reportPath = join(artifactDir, 'review_report.md')
      writeFileSync(reportPath, report, 'utf8')
      return report + '\n\nSaved to ' + reportPath
    },
  }))
}