import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# wod-query — 从 NOAA WOD 查询 CTD 剖面

## 目标
按 bbox + 时间 + 深度范围，从 NOAA World Ocean Database (WOD) 下载 CTD 数据并保存为 NetCDF。

## 步骤
1. 使用 Python 的 \`wodpy\` 库或 NOAA WOD RESTful API：
   - API endpoint: https://www.ncei.noaa.gov/access/data/wod/ (需查具体版本)
   - 或使用 \`xarray\` + \`opendap\` 直接读取 WOD OPeNDAP 服务
2. 参数：north, south, east, west, start_year, end_year, max_depth
3. 保存为本地 NetCDF 文件
4. 调用 generate_figure_with_trace 画 T-S 图或断面图
5. 将文件信息记录到 research-manifest.json

## 注意事项
- WOD 数据量大，建议先限定小区域和短时间段
- 需要安装: pip install wodpy xarray netCDF4
- 如果网络受限，可先下载 WOD 子集到本地再处理
`

export function registerWodQuerySkill(ctx: Context) {
  ctx.skills?.register({
    name: 'wod-query',
    description: 'Query CTD profiles from NOAA World Ocean Database by bounding box, time range, and depth.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}