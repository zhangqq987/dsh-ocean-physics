import type { Context } from '@deepseek-ai/cordis'
import { registerDensityTool } from './tools/density.js'
import { registerN2Tool } from './tools/n2.js'
import { registerTraceTool } from './tools/trace.js'
import { registerReviewerTool } from './tools/reviewer.js'
import { registerCtdSkill } from './skills/ctd-nc-processing.js'
import { registerN2Skill } from './skills/n2-compute.js'
import { registerLitSearchSkill } from './skills/lit-search.js'

export const inject = ['tools', 'skills']

export function apply(ctx: Context) {
  registerDensityTool(ctx)
  registerN2Tool(ctx)
  registerTraceTool(ctx)
  registerReviewerTool(ctx)
  registerCtdSkill(ctx)
  registerN2Skill(ctx)
  registerLitSearchSkill(ctx)
}