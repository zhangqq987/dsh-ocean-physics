import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { writeFileSync } from 'node:fs'

export function registerHpcTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'submit_hpc_job',
    description: 'Generate a SLURM batch script for ocean data processing. Does NOT auto-submit; prints the sbatch command for the user to run manually.',
    parameters: {
      jobName: { type: 'string', required: true, description: 'SLURM job name' },
      account: { type: 'string', description: 'SLURM account/partition (optional)' },
      nodes: { type: 'number', required: true, description: 'Number of nodes' },
      ntasksPerNode: { type: 'number', required: true, description: 'Tasks per node' },
      time: { type: 'string', required: true, description: 'Wall time limit, e.g. 01:00:00' },
      pythonScript: { type: 'string', required: true, description: 'Python script path to run on HPC' },
      email: { type: 'string', description: 'Email for job notifications (optional)' },
    },
    output: { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] },
    async execute(args) {
      let script = '#!/bin/bash\n'
      script += `#SBATCH --job-name=${args.jobName}\n`
      if (args.account) script += `#SBATCH --account=${args.account}\n`
      script += `#SBATCH --nodes=${args.nodes}\n`
      script += `#SBATCH --ntasks-per-node=${args.ntasksPerNode}\n`
      script += `#SBATCH --time=${args.time}\n`
      script += '#SBATCH --output=%x_%j.out\n'
      script += '#SBATCH --error=%x_%j.err\n'
      if (args.email) script += `#SBATCH --mail-user=${args.email}\n`
      if (args.email) script += '#SBATCH --mail-type=END,FAIL\n'
      script += '\nmodule load python/3.10\nsource ~/.venvs/gsw/bin/activate\n\n'
      script += `python ${args.pythonScript}\n`

      const scriptPath = `${args.jobName}.slurm`
      writeFileSync(scriptPath, script, 'utf8')

      return `SLURM script written to ${scriptPath}\n\nTo submit:\n  sbatch ${scriptPath}`
    },
  }))
}