import type { Context } from "@deepseek-ai/cordis"
import { defineTool } from "@deepseek-ai/dsh-tools"
import { existsSync, writeFileSync } from "node:fs"

export function registerValidateNetcdfTool(ctx: Context) {
  ctx.tools.register(defineTool({
    name: "validate_netcdf",
    description: "Inspect a NetCDF file: list dimensions, variables, global attributes, and check for NaN/inf values.",
    parameters: {
      filePath: { type: "string", required: true, description: "Path to NetCDF file" },
    },
    output: { schema: { type: "string" }, render: (_a: any, v: any) => [{ type: "text", text: v }] },
    async execute(args: any) {
      if (!existsSync(args.filePath)) return "File not found: " + args.filePath
      const code = `
import xarray as xr
import numpy as np
ds = xr.open_dataset("${args.filePath}")
print("=== Dimensions ===")
for k, v in ds.dims.items(): print(f"  {k}: {v}")
print("\\n=== Variables ===")
for k, v in ds.data_vars.items(): print(f"  {k}: shape={v.shape}, dtype={v.dtype}")
print("\\n=== Global Attrs ===")
for k, v in ds.attrs.items(): print(f"  {k}: {v}")
print("\\n=== NaN Check ===")
for k in ds.data_vars:
    arr = ds[k].values
    if np.issubdtype(arr.dtype, np.number):
        n_nan = np.isnan(arr).sum()
        n_inf = np.isinf(arr).sum()
        print(f"  {k}: NaN={n_nan}, Inf={n_inf}")
ds.close()
`
      const p = "artifacts/_ncvalidate_tmp.py"
      writeFileSync(p, code, "utf8")
      const { execSync } = require("node:child_process")
      try { return execSync(`python "${p}"`, { encoding: "utf8" }) } catch (e: any) { return "Error: " + String(e) }
    },
  }))
}