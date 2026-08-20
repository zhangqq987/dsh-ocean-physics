import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const STATE_FILE = 'research-manifest.json'

function loadState() {
  const empty = { hypotheses: [], literature: [], datasets: [], figures: [], claims: [], forks: [] }
  if (!existsSync(STATE_FILE)) return empty
  const raw = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  return { ...empty, ...raw, hypotheses: raw.hypotheses || [] }
}
function saveState(state: any) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

export function registerResearchStateTool(ctx: Context) {
  // 1. 记录声明（claim）
  ctx.tools.register(defineTool({
    name: 'log_claim',
    description: 'Log a research claim (conclusion) and optionally link it to a figure.',
    parameters: {
      claimId: { type: 'string', required: true, description: 'Unique claim ID, e.g. C1' },
      content: { type: 'string', required: true, description: 'Claim text' },
      figureRef: { type: 'string', description: 'Figure filename this claim is based on (optional)' },
      hypothesisRef: { type: 'string', description: 'Hypothesis ID this claim supports or refutes (optional)' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const state = loadState()
      state.claims.push({
        id: args.claimId,
        content: args.content,
        figureRef: args.figureRef || null,
        hypothesisRef: args.hypothesisRef || null,
        time: new Date().toISOString(),
      })
      saveState(state)
      return `Claim ${args.claimId} logged.`
    },
  }))

  // 2. 记录数据集
  ctx.tools.register(defineTool({
    name: 'log_dataset',
    description: 'Register a dataset used in the research with its source and processing steps.',
    parameters: {
      datasetId: { type: 'string', required: true, description: 'Unique dataset ID, e.g. D1' },
      name: { type: 'string', required: true, description: 'Dataset name' },
      source: { type: 'string', required: true, description: 'Source URL or description' },
      processingSteps: { type: 'string', description: 'Key processing steps applied' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const state = loadState()
      state.datasets.push({
        id: args.datasetId,
        name: args.name,
        source: args.source,
        processingSteps: args.processingSteps || '',
        time: new Date().toISOString(),
      })
      saveState(state)
      return `Dataset ${args.datasetId} registered.`
    },
  }))

  // 3. Fork 会话
  ctx.tools.register(defineTool({
    name: 'fork_research_session',
    description: 'Create a named fork of the current research state for exploring alternative approaches.',
    parameters: {
      forkName: { type: 'string', required: true, description: 'Name of the fork, e.g. H1a_threshold_method' },
      description: { type: 'string', required: true, description: 'What differs in this fork' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      const state = loadState()
      const fork = {
        name: args.forkName,
        description: args.description,
        parentTime: new Date().toISOString(),
        snapshot: JSON.parse(JSON.stringify(state)),
      }
      state.forks.push(fork)
      saveState(state)
      return `Research session forked: ${args.forkName}. Description: ${args.description}. Total forks: ${state.forks.length}`
    },
  }))

  // 4. 查看完整状态
  ctx.tools.register(defineTool({
    name: 'view_research_state',
    description: 'View the full research manifest: all hypotheses, literature, datasets, figures, claims, and forks.',
    parameters: {},
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute() {
      const state = loadState()
      let report = '# Research Manifest\n\n'
      report += `## Hypotheses (${state.hypotheses.length})\n`
      state.hypotheses.forEach((h: any) => { report += `- [${h.status}] ${h.id}: ${h.content}\n` })
      report += `\n## Literature (${state.literature.length})\n`
      state.literature.forEach((l: any) => { report += `- ${l.doi || l.title}: ${l.title}\n` })
      report += `\n## Datasets (${state.datasets.length})\n`
      state.datasets.forEach((d: any) => { report += `- ${d.id}: ${d.name} (${d.source})\n` })
      report += `\n## Figures (${state.figures.length})\n`
      state.figures.forEach((f: any) => { report += `- ${f.figure}: ${f.code}\n` })
      report += `\n## Claims (${state.claims.length})\n`
      state.claims.forEach((c: any) => { report += `- ${c.id}: ${c.content}${c.figureRef ? ' [from ' + c.figureRef + ']' : ''}\n` })
      report += `\n## Forks (${state.forks.length})\n`
      state.forks.forEach((f: any) => { report += `- ${f.name}: ${f.description}\n` })
      return report
    },
  }))
}