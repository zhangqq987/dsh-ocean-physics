import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export function registerReviewerUpgradeTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "audit_deep",
    description: "Deep audit: verify DOIs via HEAD request.",
    parameters: {
      doiList: { type: "string", required: true, description: "Comma-separated DOIs" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      let report = "# Deep Audit\n\n## DOI Check\n"
      const dois = args.doiList.split(",").map((d: string) => d.trim()).filter(Boolean)
      for (const doi of dois) {
        try {
          const res = await fetch("https://doi.org/" + doi, { method: "HEAD", redirect: "manual" })
          report += `- [${res.status >= 200 && res.status < 400 ? "OK" : "FAIL"}] ${doi} (HTTP ${res.status})\n`
        } catch (e: any) { report += `- [FAIL] ${doi} (${e.message})\n` }
      }
      const p = join("artifacts", "deep_audit_report.md")
      writeFileSync(p, report, "utf8")
      return report + "\nSaved to " + p
    },
  }))
}