import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { execSync } from "node:child_process"
import { existsSync, writeFileSync } from "node:fs"

export function registerCompareFiguresTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "compare_figures",
    description: "Create a side-by-side comparison of two existing figures.",
    parameters: {
      figureA: { type: "string", required: true, description: "First figure name" },
      figureB: { type: "string", required: true, description: "Second figure name" },
      outputName: { type: "string", required: true, description: "Output comparison figure name" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      const code = `
import matplotlib.pyplot as plt
from PIL import Image
fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].imshow(Image.open("artifacts/${args.figureA}"))
axes[0].axis("off")
axes[1].imshow(Image.open("artifacts/${args.figureB}"))
axes[1].axis("off")
plt.savefig("artifacts/${args.outputName}", dpi=150, bbox_inches="tight")
`
      const p = "artifacts/_compare_tmp.py"
      writeFileSync(p, code, "utf8")
      try { execSync(`python "${p}"`, { encoding: "utf8" }) } catch (e: any) { return "Error: " + String(e) }
      return `Comparison saved: artifacts/${args.outputName}`
    },
  }))
}