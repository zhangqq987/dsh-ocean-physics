import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

export function registerModalGpuTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "submit_modal_gpu",
    description: "Generate a Modal GPU job script.",
    parameters: {
      pythonCode: { type: "string", required: true, description: "Python code to run" },
      outputName: { type: "string", required: true, description: "Output script name" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      if (!existsSync("artifacts")) mkdirSync("artifacts", { recursive: true })
      const code = `import modal\napp = modal.App("gpu-job")\n@app.function(gpu=modal.gpu.T4(), timeout=3600)\ndef main():\n${args.pythonCode.split("\n").map((l: string) => "    " + l).join("\n")}\n@app.local_entrypoint()\ndef entrypoint(): main.remote()\nif __name__ == "__main__": entrypoint()`
      const p = join("artifacts", args.outputName + ".py")
      writeFileSync(p, code, "utf8")
      return `Modal script: ${p}\nRun: modal run ${p}`
    },
  }))
}