import type { Context } from '@deepseek-ai/cordis'
import { registerDensityTool } from './tools/density.js'
import { registerN2Tool } from './tools/n2.js'
import { registerTraceTool } from './tools/trace.js'
import { registerReviewerTool } from './tools/reviewer.js'
import { registerHypothesisTool } from './tools/hypo.js'
import { apply as applyCtd } from './skills/ctd-nc-processing.js'
import { apply as applyN2 } from './skills/n2-compute.js'
import { apply as applyLit } from './skills/lit-search.js'

export const inject = ['tools', 'skills']

export function apply(ctx: Context) {
  registerDensityTool(ctx)
  registerN2Tool(ctx)
  registerTraceTool(ctx)
  registerReviewerTool(ctx)
  registerHypothesisTool(ctx)
  applyCtd(ctx)
  applyN2(ctx)
  applyLit(ctx)
}