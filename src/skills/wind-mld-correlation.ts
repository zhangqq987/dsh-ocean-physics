import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# wind-mld-correlation — 风速与混合层深度相关性分析

## 目标
验证假设 H1：黄海冬季混合层深度（MLD）与海面风速正相关。

## 方法
1. 从 CTD 数据计算 MLD（密度阈值法 0.03 kg/m³ 或 梯度法）
2. 从 ERA5 拉同期同区 10m 风速（u10, v10 → wind_speed = sqrt(u²+v²)）
3. 对 MLD 和 wind_speed 做 Pearson/Spearman 相关
4. 画散点图（x=wind_speed, y=MLD）含回归线
5. 调用 generate_figure_with_trace_v2 出图
6. 用 log_claim 记录结论（支持/反对 H1，p 值，r 值）
7. 用 view_research_state 确认全链路完整

## 统计注意事项
- 样本量 n ≥ 10 才有统计意义
- 考虑季节性：只取 DJF（12-2月）
- 考虑深度范围：MLD 通常 10-200 dbar
- 风速和 MLD 可能都有自相关，用 bootstrap 置信区间更稳健
`

export function registerWindMldCorrelationSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'wind-mld-correlation',
    description: 'Analyze correlation between wind speed and mixed layer depth to validate H1.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}