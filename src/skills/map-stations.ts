import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# map-stations — CTD 站位地图渲染

## 目标
用 cartopy + matplotlib 画 CTD 站位散点图，必须保存代码和 env.txt。

## 步骤
1. 读取 CTD NetCDF 文件，提取经纬度数组 lon、lat。
2. 写 Python 脚本：
   - import cartopy.crs as ccrs
   - fig = plt.figure(); ax = fig.add_subplot(1,1,1, projection=ccrs.PlateCarree())
   - ax.coastlines(); ax.gridlines(draw_labels=True)
   - ax.scatter(lon, lat, transform=ccrs.PlateCarree(), c='red', s=20)
   - ax.set_title('CTD Stations')
3. 调用 generate_figure_with_trace，pythonCode 为上述脚本，figureName 为 ctd_stations.png。
4. 报告文件路径和站位数量。
`

export function registerMapStationsSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'map-stations',
    description: 'Render CTD station locations on a cartopy map with coastlines and gridlines.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}