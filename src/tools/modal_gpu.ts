import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export function registerModalGpuTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'submit_modal_gpu',
    description: 'Generate a Modal GPU job script for heavy ocean model training/inference. Requires Modal CLI configured.',
    parameters: {
      pythonCode: { type: 'string', required: true, description: 'Python script to run on GPU' },
      gpuType: { type: 'string', required: false, description: 'GPU type: T4, A10G, A100, H100 (default T4)' },
      memoryGb: { type: 'number', required: false, description: 'RAM in GB (default 16)' },
      outputName: { type: 'string', required: true, description: 'Output script filename' },
    },
    output: { schema: { type: 'string' }, render: (_a: any, v: any) => [{ type: 'text', text: v }] },
    async execute(args: any) {
      if (!existsSync('artifacts')) mkdirSync('artifacts', { recursive: true })
      const gpu = args.gpuType || 'T4'
      const mem = args.memoryGb || 16
      const code = `#!/usr/bin/env python3
# Modal GPU job: ${gpu}, ${mem}GB RAM
# Run: modal run ${args.outputName}.py
import modal

app = modal.App("ocean-gpu-job")

@app.function(
    gpu=modal.gpu.${gpu === 'T4' ? 'T4()' : gpu === 'A10G' ? 'A10G()' : gpu === 'A100' ? 'A100()' : 'H100()'},
    memory=${mem * 1024},
    timeout=3600,
)
def main():
${args.pythonCode.split('\n').map((l: string) => '    ' + l).join('\n')}

@app.local_entrypoint()
def entrypoint():
    main.remote()

if __name__ == "__main__":
    entrypoint()
`
      const scriptPath = join('artifacts', args.outputName + '.py')
      writeFileSync(scriptPath, code, 'utf8')
      return `Modal GPU job script written to ${scriptPath}\nGPU: ${gpu}, RAM: ${mem}GB\nRun: modal run ${scriptPath}`
    },
  }))
}
