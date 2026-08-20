import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { existsSync, appendFileSync, mkdirSync } from "node:fs"

export function registerLogChatTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "log_chat",
    description: "Save a chat message to artifacts/chat_history.jsonl for audit trail.",
    parameters: {
      content: { type: "string", required: true, description: "Message content to save" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      if (!existsSync("artifacts")) mkdirSync("artifacts", { recursive: true })
      appendFileSync("artifacts/chat_history.jsonl", JSON.stringify({ role: "user", content: args.content, time: new Date().toISOString() }) + "\n")
      return "Chat saved."
    },
  }))
}