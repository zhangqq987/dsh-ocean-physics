import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function registerReviewerUpgradeTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'audit_deep',
    description: 'Deep audit: verify DOIs via HEAD request + trace numeric claims back to source data files.',
    parameters: {
      doiList: { type: 'string', required: false, description: 'Comma-separated DOIs to verify' },
      claimFile: { type: 'string', required: false, description: 'Path to a .py or .nc file to trace numeric values from' },
      expectedValue: { type: 'string', required: false, description: 'Expected numeric value to find in claimFile, e.g. "52.97"' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      let report = '# Deep Audit Report\n\n'

      // DOI verification
      report += '## DOI Verification\n'
      const dois = args.doiList ? args.doiList.split(',').map((d: string) => d.trim()).filter(Boolean) : []
      if (dois.length === 0) {
        report += 'No DOIs provided.\n'
      } else {
        for (const doi of dois) {
          try {
            const res = await fetch('https://doi.org/' + doi, { method: 'HEAD', redirect: 'manual' })
            report += `- [${res.status >= 200 && res.status < 400 ? 'OK' : 'FAIL'}] ${doi} (HTTP ${res.status})\n`
          } catch (e: any) {
            report += `- [FAIL] ${doi} (${e.message})\n`
          }
        }
      }

      // Numeric traceability
      report += '\n## Numeric Traceability\n'
      if (args.claimFile && args.expectedValue) {
        if (!existsSync(args.claimFile)) {
          report += `File not found: ${args.claimFile}\n`
        } else if (args.claimFile.endsWith('.py')) {
          const content = readFileSync(args.claimFile, 'utf8')
          const found = content.includes(args.expectedValue)
          report += `Searching for "${args.expectedValue}" in ${args.claimFile}: ${found ? 'FOUND' : 'NOT FOUND'}\n`
        } else {
          report += `Cannot trace ${args.claimFile} (not a .py file). Use ocean_compute_N2 output directly.\n`
        }
      } else {
        report += 'No claim file/value provided.\n'
      }

      const reportPath = join('artifacts', 'deep_audit_report.md')
      writeFileSync(reportPath, report, 'utf8')
      return report + '\n\nSaved to ' + reportPath
    },
  }))
}
