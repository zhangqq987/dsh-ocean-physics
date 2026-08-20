import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

export function registerExportSessionReportTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "export_session_report",
    description: "Export a full Markdown report of the research session: hypotheses, literature, datasets, figures, claims, and audit log.",
    parameters: {
      outputName: { type: "string", required: true, description: "Output markdown filename" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      let report = "# Research Session Report\n\n"
      const manifestPath = "research-manifest.json"
      if (existsSync(manifestPath)) {
        const m = JSON.parse(readFileSync(manifestPath, "utf8"))
        report += "## Hypotheses\n" + (m.hypotheses || []).map((h: any) => `- ${h.id}: ${h.text}`).join("\n") + "\n\n"
        report += "## Datasets\n" + (m.datasets || []).map((d: any) => `- ${d.id}: ${d.name}`).join("\n") + "\n\n"
        report += "## Claims\n" + (m.claims || []).map((c: any) => `- ${c.id}: ${c.content}`).join("\n") + "\n\n"
      }
      if (existsSync("artifacts/review_log.jsonl")) {
        report += "## Audit Log\n" + readFileSync("artifacts/review_log.jsonl", "utf8").split("\n").filter(Boolean).slice(-10).map((l, i) => `${i + 1}. ${JSON.parse(l).tool}: ${JSON.parse(l).checks?.join(", ")}`).join("\n") + "\n"
      }
      const outPath = "artifacts/" + args.outputName + ".md"
      writeFileSync(outPath, report, "utf8")
      return "Report exported to " + outPath
    },
  }))
}