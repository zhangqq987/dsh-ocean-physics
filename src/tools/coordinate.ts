import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"

export function registerCoordinateTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "coordinate_research",
    description: "Break a research task into sub-steps.",
    parameters: {
      topic: { type: "string", required: true, description: "Research topic" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      return `# Research Plan: ${args.topic}\n\n1. lit-search\n2. wod-query or era5_wind\n3. ctd-nc-processing or ocean_compute_N2\n4. generate_figure_with_trace\n5. view_audit_log`
    },
  }))
}