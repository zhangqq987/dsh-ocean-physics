import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { existsSync, appendFileSync, mkdirSync } from 'node:fs'

export function registerLogChatTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'log_chat',
    description: 'Save a chat message to artifacts/chat_history.jsonl for later inclusion in figure audit trails.',
    parameters: {
      role: { type: 'string', required: true, description: 'user or assistant' },
      content: { type: 'string', required: true, description: 'Message content to save' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      if (!existsSync('artifacts')) mkdirSync('artifacts', { recursive: true })
      appendFileSync('artifacts/chat_history.jsonl', JSON.stringify({ role: args.role, content: args.content, time: new Date().toISOString() }) + '\n')
      return 'Chat message saved to audit trail.'
    },
  }))
}
