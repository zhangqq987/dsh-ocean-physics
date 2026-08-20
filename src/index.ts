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
import { registerExportFigureTool } from './tools/export_figure.js'
import { registerCompareFiguresTool } from './tools/compare_figures.js'
import { registerComputeStatsTool } from './tools/compute_stats.js'
import { registerSearchArxivTool } from './tools/search_arxiv.js'
import { registerExportSessionReportTool } from './tools/export_session_report.js'
import { registerValidateNetcdfTool } from './tools/validate_netcdf.js'
import { registerMldClimatologySkill } from './skills/mld-climatology.js'
import { registerTidalMixingSkill } from './skills/tidal-mixing.js'
import { registerRossbyWavesSkill } from './skills/rossby-waves.js'
import { registerPaperDraftSkill } from './skills/paper-draft.js'

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
registerExportFigureTool(ctx)
  registerCompareFiguresTool(ctx)
  registerComputeStatsTool(ctx)
  registerSearchArxivTool(ctx)
  registerExportSessionReportTool(ctx)
  registerValidateNetcdfTool(ctx)
  registerMldClimatologySkill(ctx)
  registerTidalMixingSkill(ctx)
  registerRossbyWavesSkill(ctx)
  registerPaperDraftSkill(ctx)
}
