import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const MEMORY_FILE = 'session-memory.json'

function loadMemory() {
  if (!existsSync(MEMORY_FILE)) return {}
  try { return JSON.parse(readFileSync(MEMORY_FILE, 'utf8')) } catch { return {} }
}

function saveMemory(m: any) {
  writeFileSync(MEMORY_FILE, JSON.stringify(m, null, 2), 'utf8')
}

export function registerSessionMemoryTool(ctx: Context) {
  // 初始化：把 research-manifest 的内容加载到 ctx.state
  const mem = loadMemory()
  ;(ctx as any).state = { ...mem }

  // 提供 Tool：记住一个键值对
  ctx.tools.register(defineTool({
    name: 'remember',
    description: 'Store a key-value pair in persistent session memory (survives restarts).',
    parameters: {
      key: { type: 'string', required: true, description: 'Key name' },
      value: { type: 'string', required: true, description: 'Value to store' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const m = loadMemory()
      m[args.key] = { value: args.value, time: new Date().toISOString() }
      saveMemory(m)
      ;(ctx as any).state = { ...m }
      return `Remembered: ${args.key} = ${args.value}`
    },
  }))

  // 提供 Tool：回忆一个键
  ctx.tools.register(defineTool({
    name: 'recall',
    description: 'Recall a value from persistent session memory by key.',
    parameters: {
      key: { type: 'string', required: true, description: 'Key name to recall' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const m = loadMemory()
      if (!(args.key in m)) return `No memory for key: ${args.key}`
      return `${args.key} = ${m[args.key].value} (stored at ${m[args.key].time})`
    },
  }))

  // 提供 Tool：列出所有记忆
  ctx.tools.register(defineTool({
    name: 'list_memory',
    description: 'List all keys in persistent session memory.',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute() {
      const m = loadMemory()
      const keys = Object.keys(m)
      if (keys.length === 0) return 'Memory is empty.'
      return keys.map(k => `${k} = ${m[k].value} (${m[k].time})`).join('\n')
    },
  }))
}