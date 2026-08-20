import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { execSync } from "node:child_process"
import { writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"

function ensureArtifacts() {
  if (!existsSync("artifacts")) mkdirSync("artifacts", { recursive: true })
}

function hashFile(path: string): string {
  if (!existsSync(path)) return "missing"
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16)
}

export function registerTraceTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "generate_figure_with_trace",
    description: "Generate a figure with full audit.",
    parameters: {
      pythonCode: { type: "string", required: true, description: "Full Python script" },
      figureName: { type: "string", required: true, description: "Output filename" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      ensureArtifacts()
      const figureRel = "artifacts/" + args.figureName
      const codePath = join("artifacts", args.figureName.replace(/\.png$/, ".py"))
      const codeToRun = args.pythonCode + `\nimport matplotlib.pyplot as plt\nplt.savefig("${figureRel}", dpi=150, bbox_inches="tight")`
      writeFileSync(codePath, codeToRun, "utf8")
      try { execSync("pip list --format=freeze", { encoding: "utf8", stdio: "pipe" }) } catch {}
      try { execSync(`python "${codePath}"`, { encoding: "utf8" }) } catch (e: any) { return "Error: " + String(e) }
      const figHash = hashFile(figureRel)
      appendFileSync("artifacts/review_log.jsonl", JSON.stringify({ time: new Date().toISOString(), tool: "generate_figure_with_trace", ok: figHash !== "missing", checks: ["figure_hash=" + figHash] }) + "\n")
      return `Figure saved to ${figureRel}\nCode: ${codePath}\nAudit: figure_hash=${figHash}`
    },
  }))
}
