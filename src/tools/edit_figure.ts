import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"

export function registerEditFigureTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "edit_figure",
    description: "Edit an existing figure by modifying its Python code and re-running.",
    parameters: {
      figureName: { type: "string", required: true, description: "Existing figure name" },
      editInstruction: { type: "string", required: true, description: "Python code to append" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      const oldCodePath = join("artifacts", args.figureName.replace(/\.png$/, ".py"))
      if (!existsSync(oldCodePath)) return "Error: no code at " + oldCodePath
      const oldCode = readFileSync(oldCodePath, "utf8")
      const userCode = oldCode.replace(/\nimport matplotlib\.pyplot as plt\nplt\.savefig\([^)]+\)\n?/, "")
      const editedCode = userCode + "\n" + args.editInstruction
      const figureRel = "artifacts/" + args.figureName
      const newCodePath = join("artifacts", args.figureName.replace(/\.png$/, ".py"))
      const codeToRun = editedCode + `\nimport matplotlib.pyplot as plt\nplt.savefig("${figureRel}", dpi=150, bbox_inches="tight")`
      writeFileSync(newCodePath, codeToRun, "utf8")
      try { execSync(`python "${newCodePath}"`, { encoding: "utf8" }) } catch (e: any) { return "Error: " + String(e) }
      const figHash = createHash("sha256").update(readFileSync(figureRel)).digest("hex").slice(0, 16)
      appendFileSync("artifacts/review_log.jsonl", JSON.stringify({ time: new Date().toISOString(), tool: "edit_figure", ok: true, checks: ["hash=" + figHash] }) + "\n")
      return `Edited: ${figureRel}\nHash: ${figHash}`
    },
  }))
}