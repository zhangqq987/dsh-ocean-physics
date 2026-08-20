import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# mld-climatology — MLD 气候态产品下载与对比

## 目标
下载 WOA18（World Ocean Atlas 2018）或 ESA CCI 的 MLD 气候态产品，与本地 CTD 算出的 MLD 对比验证。

## 数据源
- WOA18: https://www.ncei.noaa.gov/data/oceans/woa/WOA18/DATA/temperature/netcdf/decav/0.25/
- ESA CCI: https://data.ceda.ac.uk/neodc/esacci

## 步骤
1. 用 xarray 打开 WOA18 的 t.anm.mon.clim.nc
2. 提取黄海 bbox 的冬季（DJF）平均温度剖面
3. 用密度阈值法算气候态 MLD
4. 与本地 CTD 算出的 MLD 做散点图对比
5. 调用 generate_figure_with_trace_v2 出图
6. 用 log_claim 记录偏差

## 注意事项
- WOA18 是月均气候态，不是单剖面
- 空间分辨率 0.25°，黄海区域约 40×30 格点
`

export function registerMldClimatologySkill(ctx: Context) {
  ctx.skills?.register({
    name: 'mld-climatology',
    description: 'Download and compare MLD climatologies (WOA18/ESA CCI) against local CTD calculations.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}