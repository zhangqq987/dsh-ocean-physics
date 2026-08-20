import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export function registerCoordinateTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'coordinate_research',
    description: 'Break a research task into sub-steps and execute them sequentially: (1) search literature, (2) process data, (3) generate figure. Returns a summary.',
    parameters: {
      topic: { type: 'string', required: true, description: 'Research topic, e.g. "Yellow Sea winter MLD vs wind"' },
      bbox: { type: 'string', required: false, description: 'Bounding box: north,south,east,west' },
      dateRange: { type: 'string', required: false, description: 'Date range: start,end e.g. 2015-01-01,2020-12-31' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      const steps: string[] = []
      steps.push(`Step 1: Literature search for "${args.topic}" → use lit-search skill`)
      steps.push(`Step 2: Data query → use query_era5_wind or wod-query with bbox=${args.bbox || 'not set'}`)
      steps.push(`Step 3: Process → use ctd-nc-processing or ocean_compute_N2`)
      steps.push(`Step 4: Visualize → use generate_figure_with_trace`)
      steps.push(`Step 5: Audit → use audit_deep or view_audit_log`)
      return `# Research Coordination Plan\n\n${steps.join('\n')}\n\nExecute each step using the corresponding tool or skill.`
    },
  }))
}
