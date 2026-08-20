import type { Context } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `
# CTD NetCDF 数据处理专家

当用户上传或指定 CTD 观测的 NetCDF 文件（.nc）并要求处理、计算或绘图时，使用本技能。

## 数据读取
- 使用 xarray 打开：import xarray as xr; ds = xr.open_dataset('file.nc')
- 先用 ds 和 ds.data_vars 查看变量名，常见命名：
  - 温度：TEMP、temperature、TEMPW、PSAL_TEMP
  - 盐度：PSAL、salinity、CNDC（需转换）
  - 压强：PRES、PRESW、pressure、z
- 注意 CF conventions：有些文件用标准名，有些用 SeaDataNet 命名

## 数据清洗
- 去掉上升段：保留 PRES 单调递增的部分
- 检查异常值：温度 -2~35℃，盐度 0~42，压强 >= 0
- 如果数据是剖面维度，用 ds.isel(PROFILE=0) 取单条剖面

## 重采样（bin average）
- 按 1 dbar 间隔分组平均

## 科学计算（gsw）
- 位温：gsw.ptmp(SA, CT, p)
- 绝对盐度：gsw.SA_from_SP(SP, p, lon, lat)
- 位密 sigma0：gsw.sigma0(SA, CT)
- 声速：gsw.sound_speed(SA, CT, p)

## 可视化
- T-S 图：scatter(SA, CT)，colorbar 用压强
- 垂直剖面：温度/盐度 vs 压强（y 轴翻转，0 在顶）

## 诊断量
- 混合层深度（密度跃层法，阈值 0.03 kg/m³）
- Brunt-Vaisala 频率 N2：gsw.Nsquared(SA, CT, p, lat)

## Python 依赖
gsw, xarray, netcdf4, matplotlib, pandas, numpy

## 注意事项
- 温度单位：CTD 原始通常是 ITS-90，gsw 用保守温度 CT，需转换
- 盐度：如果是实用盐度 SP（PSS-78），先用 gsw.SA_from_SP 转绝对盐度
- 压强单位确认是 dbar
- NetCDF 可能有 _FillValue 或 NaN，groupby 前先 dropna
`.trim()

export function registerCtdSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'ctd-nc-processing',
    description: '处理 NetCDF 格式 CTD 剖面：读取、清洗、bin average、gsw 计算、T-S 图、混合层深度',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}