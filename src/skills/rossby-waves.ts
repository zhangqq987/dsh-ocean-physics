import { defineSkill } from '@deepseek-ai/cordis'

const SKILL_CONTENT = `# rossby-waves — 罗斯贝波诊断

## 目标
计算黄海区域位涡（PV）、罗斯贝变形半径，诊断行星波和拓扑罗斯贝波。

## 方法
1. 从 SODA 或 GLORYS 再分析数据提取 SSH 和温度
2. 计算绝对位涡：PV = (f + zeta) / h
3. 罗斯贝变形半径：L_R = sqrt(g * h) / f
4. 波导分析：PV 梯度为零的位置
5. 出图：位涡分布 + 波导位置

## 注意事项
- 黄海是浅海陆架，L_R 约 20-50km（比大洋小一个量级）
- 行星 Rossby 波在陆架有拓扑约束
`

export function registerRossbyWavesSkill(ctx: Context) {
  ctx.skills?.register({
    name: 'rossby-waves',
    description: 'Diagnose Rossby waves, PV, and deformation radius in shelf seas.',
    content: SKILL_CONTENT,
    source: 'bundled',
  })
}