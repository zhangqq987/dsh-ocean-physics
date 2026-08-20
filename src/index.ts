import type { Context } from '@deepseek-ai/cordis'
import { registerDensityTool } from './tools/density.js'
import { registerN2Tool } from './tools/n2.js'
import { registerTraceTool } from './tools/trace.js'
import { registerReviewerTool } from './tools/reviewer.js'
import { registerHypothesisTool } from './tools/hypo.js'
import { registerHpcTool } from './tools/hpc.js'
import { registerCtdSkill } from './skills/ctd-nc-processing.js'
import { registerN2Skill } from './skills/n2-compute.js'
import { registerLitSearchSkill } from './skills/lit-search.js'
import { registerMapStationsSkill } from './skills/map-stations.js'
import { registerWodQuerySkill } from './skills/wod-query.js'
import { registerSectionTool } from './tools/section.js'
import { registerEra5WindTool } from './tools/era5_wind.js'
import { registerResearchStateTool } from './tools/research_state.js'
import { registerReviewerHook } from './tools/reviewer_hook.js'
import { registerViewReviewLogTool } from './tools/view_review_log.js'
import { registerTraceV2Tool } from './tools/trace_v2.js'
import { registerCopernicusMarineTool } from './tools/copernicus_marine.js'
import { registerNcepWindTool } from './tools/ncep_wind.js'
import { registerArgoProfileSkill } from './skills/argo-profile.js'
import { registerWindMldCorrelationSkill } from './skills/wind-mld-correlation.js'
import { registerLogChatTool } from './tools/log_chat.js'
import { registerEditFigureTool } from './tools/edit_figure.js'
import { registerReviewerUpgradeTool } from './tools/reviewer_upgrade.js'
import { registerCoordinateTool } from './tools/coordinate.js'
import { registerModalGpuTool } from './tools/modal_gpu.js'

export const inject = ['tools', 'skills']

export function apply(ctx: Context) {
  registerDensityTool(ctx)
  registerN2Tool(ctx)
  registerTraceTool(ctx)
  registerReviewerTool(ctx)
  registerHypothesisTool(ctx)
  registerCtdSkill(ctx)
  registerN2Skill(ctx)
  registerHpcTool(ctx)
  registerLitSearchSkill(ctx)
registerMapStationsSkill(ctx)
  registerWodQuerySkill(ctx)
  registerSectionTool(ctx)
  registerEra5WindTool(ctx)
  registerResearchStateTool(ctx)
registerReviewerHook(ctx)
registerViewReviewLogTool(ctx)
  registerTraceV2Tool(ctx)
  registerCopernicusMarineTool(ctx)
  registerNcepWindTool(ctx)
  registerArgoProfileSkill(ctx)
  registerWindMldCorrelationSkill(ctx)
registerLogChatTool(ctx)
  registerEditFigureTool(ctx)
  registerReviewerUpgradeTool(ctx)
  registerCoordinateTool(ctx)
  registerModalGpuTool(ctx)
}
