import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

export function registerEditFigureTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'edit_figure',
    description: 'Edit an existing figure by modifying its Python code. Reads the old .py, applies the edit instruction, re-runs, and saves a new figure.',
    parameters: {
      figureName: { type: 'string', required: true, description: 'Existing figure name, e.g. test_auto.png' },
      editInstruction: { type: 'string', required: true, description: 'What to change, e.g. "add xlabel(\'X\'), ylabel(\'Y\'), title(\'Scatter\'), remove grid"' },
      newFigureName: { type: 'string', required: false, description: 'New figure name (default: overwrite old)' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const oldCodePath = join('artifacts', args.figureName.replace(/\.png$/, '.py'))
      if (!existsSync(oldCodePath)) return 'Error: no code found at ' + oldCodePath + '. Cannot edit.'

      const oldCode = readFileSync(oldCodePath, 'utf8')
      // Strip the auto-injected savefig line from old code
      const userCode = oldCode.replace(/\nimport matplotlib\.pyplot as plt\nplt\.savefig\([^)]+\)\n?/, '')

      // Apply edit: append the edit instruction as Python code
      const editedCode = userCode + '\n' + args.editInstruction
      const outFigure = args.newFigureName || args.figureName
      const figureRel = 'artifacts/' + outFigure
      const newCodePath = join('artifacts', outFigure.replace(/\.png$/, '.py'))
      const codeToRun = editedCode + `\nimport matplotlib.pyplot as plt\nplt.savefig('${figureRel}', dpi=150, bbox_inches='tight')`

      writeFileSync(newCodePath, codeToRun, 'utf8')

      try {
        execSync(`python "${newCodePath}"`, { encoding: 'utf8' })
      } catch (e: any) {
        return 'Error re-running edited code: ' + String(e)
      }

      const figHash = createHash('sha256').update(readFileSync(figureRel)).digest('hex').slice(0, 16)
      appendFileSync('artifacts/review_log.jsonl', JSON.stringify({
        time: new Date().toISOString(),
        tool: 'edit_figure',
        ok: true,
        auto_corrected: false,
        checks: ['figure_hash=' + figHash, 'edited_from=' + args.figureName, 'instruction=' + args.editInstruction],
      }) + '\n')

      return `Figure edited and saved to ${figureRel}\nCode: ${newCodePath}\nNew figure_hash=${figHash}`
    },
  }))
}
