import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { execSync } from "node:child_process"
import { existsSync } from "node:fs"

export function registerExportFigureTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "export_figure",
    description: "Re-render an existing figure code to a different format (pdf/svg/png) with high DPI.",
    parameters: {
      figureName: { type: "string", required: true, description: "Source figure name, e.g. test_auto.png" },
      format: { type: "string", required: true, description: "Target format: pdf, svg, or png" },
      dpi: { type: "string", required: true, description: "DPI as string, e.g. 300" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      const codePath = "artifacts/" + args.figureName.replace(/\.png$/, ".py")
      if (!existsSync(codePath)) return "Error: code not found at " + codePath
      const ext = args.format.startsWith(".") ? args.format : "." + args.format
      const outName = args.figureName.replace(/\.png$/, ext)
      const outPath = "artifacts/" + outName
      const dpiNum = parseInt(args.dpi) || 300
      const extra = args.format === "pdf" ? "" : `\nplt.savefig("${outPath}", dpi=${dpiNum}, bbox_inches="tight")`
      const patch = `import matplotlib.pyplot as plt\nplt.savefig("${outPath}", dpi=${dpiNum}, bbox_inches="tight")\n`
      execSync(`python -c 'exec(open("${codePath}").read()); ${patch}'`, { encoding: "utf8" })
      return `Exported: ${outPath} (${args.format}, ${args.dpi} DPI)`
    },
  }))
}
