# dsh-ocean-physics

物理海洋学 AI 插件 for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness)。

基于 Cordis 插件架构，提供 CTD 数据处理、N² 层结计算、文献查询、可复现出图和科研自查能力。

## 功能

| 类型 | 名称 | 说明 |
|------|------|------|
| Skill | `ctd-nc-processing` | CTD NetCDF 数据处理全流程（清洗→bin→gsw 计算→T-S 图→MLD） |
| Skill | `n2-compute` | N² 层结计算说明与引导 |
| Skill | `lit-search` | 通过 OpenAlex / Crossref 查文献，不瞎编引用 |
| Tool | `ocean_potential_density` | 计算位密 σ₀（gsw） |
| Tool | `ocean_compute_N2` | 计算 Brunt-Väisälä 频率 N²（gsw） |
| Tool | `generate_figure_with_trace` | 出图同时保存 Python 源码 + pip 环境快照 |
| Tool | `log_hypothesis` | 记录科研假设到 `research-manifest.json` |
| Tool | `review_session` | 自查：图码一致性 + DOI 可访问性 |
| Tool | `submit_hpc_job` | 生成 SLURM 批处理脚本（不自动提交） |

## 使用