import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# paper-draft — 论文草稿生成

## 目标
按 JGR-Oceans 或 Ocean Modelling 模板，将当前研究状态组织成论文草稿结构。

## 结构
1. **Title**: 基于假设 H1 生成
2. **Abstract**: 从 claims + literature 提炼
3. **Introduction**: 从 lit-search 结果 + H1 背景
4. **Data & Methods**: 从 datasets + skills used (ctd-nc-processing, era5_wind, compute_stats)
5. **Results**: 从 figures + claims
6. **Discussion**: 与 literature 对比，局限性
7. **Conclusion**: 从 claims 总结

## 步骤
1. 调用 view_research_state 获取全貌
2. 调用 export_session_report 导出 Markdown
3. 按上述结构重组
4. 输出完整草稿

## 注意事项
- 不要编造数据，只基于已有 claims
- 引用用 log_dataset 和 lit-search 的真实 DOI
`

export function registerPaperDraftSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'paper-draft',
    description: 'Generate a paper draft (JGR-Oceans/Ocean Modelling format) from current research state.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}