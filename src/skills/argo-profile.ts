import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# argo-profile — Argo 浮标剖面下载与处理

## 目标
从 Argo 全球海洋观测系统下载浮标 CTD 剖面 NetCDF 数据，计算位密、N²，并与气候态比较。

## 数据源
- GDAC FTP: ftp://ftp.ifremer.fr/ifremer/argo/
- 或用 \`argopandas\` Python 库（pip install argopandas）

## 步骤
1. 用 argopandas 按 bbox + 时间筛选浮标
2. 下载剖面 NetCDF（含 PRES/TEMP/PSAL）
3. 用 gsw 计算 SA/CT/sigma0
4. 计算 N²（gsw.Nsquared）
5. 与 WOD 气候态 MLD 比较
6. 调用 generate_figure_with_trace_v2 出 T-S 图和 N² 剖面
7. 用 log_dataset 注册数据来源

## 注意事项
- Argo 数据按平台 ID 组织，一个浮标多个剖面
- 需要过滤 QC 标志（用 \`< 2\` 的好的数据）
`

export function registerArgoProfileSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'argo-profile',
    description: 'Download and process Argo float CTD profiles, compute density and N2.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}