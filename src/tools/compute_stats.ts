import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { execSync, spawnSync } from "node:child_process"
import { writeFileSync, existsSync, appendFileSync } from "node:fs"

export function registerComputeStatsTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "compute_stats",
    description: "Compute Pearson/Spearman correlation, linear regression, p-value, and bootstrap CI between two variables.",
    parameters: {
      dataX: { type: "string", required: true, description: "Comma-separated numbers for X variable" },
      dataY: { type: "string", required: true, description: "Comma-separated numbers for Y variable" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      const code = `
import numpy as np
from scipy import stats
import json
x = np.array([${args.dataX}])
y = np.array([${args.dataY}])
r, p = stats.pearsonr(x, y)
spear, p_spear = stats.spearmanr(x, y)
slope, intercept, _, _, _ = stats.linregress(x, y)
# bootstrap
boot_r = []
for _ in range(1000):
    idx = np.random.choice(len(x), len(x), replace=True)
    boot_r.append(stats.pearsonr(x[idx], y[idx])[0])
ci_low, ci_high = np.percentile(boot_r, [2.5, 97.5])
result = {"pearson_r": float(r), "p_value": float(p), "spearman_r": float(spear), "p_spearman": float(p_spear), "slope": float(slope), "intercept": float(intercept), "bootstrap_95ci": [float(ci_low), float(ci_high)]}
print(json.dumps(result))
`
      const p = "artifacts/_stats_tmp.py"
      writeFileSync(p, code, "utf8")
      let out: string
      try { out = execSync(`python "${p}"`, { encoding: "utf8" }) } catch (e: any) { return "Error: scipy not installed. Run pip install scipy numpy" }
      appendFileSync("artifacts/review_log.jsonl", JSON.stringify({ time: new Date().toISOString(), tool: "compute_stats", ok: true, checks: ["result=" + out.trim().slice(0, 100)] }) + "\n")
      return "Statistics:\n" + out
    },
  }))
}