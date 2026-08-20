import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# tidal-mixing — 潮汐混合参数化

## 目标
计算 M2 潮汐耗散率、内部潮汐生成率，评估潮汐混合对黄海 MLD 的贡献。

## 方法
1. 从 TPXO 或 FES2014 获取黄海 M2 潮汐调和常数
2. 计算底摩擦耗散：epsilon = rho * c_D * u_b^3 / h
3. 内部潮汐生成率：G = rho * N * u_b^2 * h / (2 * pi)
4. 用 ERA5 风混合与潮汐混合做对比
5. 出图：混合率空间分布

## 注意事项
- 黄海 M2 振幅约 1-2m，潮差大但水深浅，底摩擦主导
- 内部潮汐在陆架边缘更重要
`

export function registerTidalMixingSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'tidal-mixing',
    description: 'Compute M2 tidal dissipation and internal tide generation for mixing assessment.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}