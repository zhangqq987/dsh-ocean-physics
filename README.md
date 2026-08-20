# dsh-ocean-physics

物理海洋学 AI 插件 for [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness)。

基于 Cordis 插件架构，提供 CTD 数据处理、N² 层结计算、文献查询、可复现出图和科研自查能力。

## 功能

### Skills（12 个）

| 名称 | 说明 |
|------|------|
| `ctd-nc-processing` | CTD NetCDF 数据处理全流程（清洗→bin→gsw 计算→T-S 图→MLD） |
| `n2-compute` | N² 层结计算说明与引导 |
| `lit-search` | 通过 OpenAlex / Crossref 查文献，不瞎编引用 |
| `wind-mld-correlation` | MLD 与风速相关性研究流程（假设→数据→统计→出图） |
| `mld-climatology` | WOA18 / ESA CCI 气候态 MLD 下载与本地 CTD 对比 |
| `tidal-mixing` | M2 潮汐耗散率与内部潮汐生成计算 |
| `rossby-waves` | 位涡（PV）、罗斯贝变形半径、波导诊断 |
| `argo-profile` | Argo 浮标数据提取 |
| `wod-query` | WOD CTD 剖面下载 |
| `map-stations` | 站位地图可视化 |
| `paper-draft` | 按 JGR-Oceans / Ocean Modelling 模板生成论文草稿（不编造数据） |
| `repro-figure` | 图件可复现性检查 |

### Tools（30 个）

**数据获取：** `wod-query`, `argo-profile`, `query_era5_wind`, `query_ncep_wind`, `copernicus-marine`

**处理计算：** `ctd-nc-processing`, `ocean_compute_N2`, `ocean_potential_density`, `hypo`, `section`

**可视化与审计：** `generate_figure_with_trace`, `generate_figure_with_trace_v2`, `edit_figure`, `compare_figures`, `export_figure`, `view_audit_log`, `view_research_state`, `log_chat`

**统计：** `compute_stats`（Pearson / Spearman 相关、线性回归、p 值、bootstrap 95% CI）

**文献：** `lit-search`, `search_arxiv`, `audit_deep`（DOI HEAD 验证）

**导出与协调：** `export_session_report`, `coordinate_research`, `fork_research_session`, `reviewer`, `reviewer_upgrade`

**算力：** `submit_hpc_job`（生成 SLURM 脚本）, `submit_modal_gpu`（生成 Modal GPU 脚本）, `validate_netcdf`

### 核心设计：全链路可审计

每个出图 Tool 自动写入 `artifacts/`：

- `*.py` — 完整 Python 绘图代码
- `env.txt` — pip 环境快照
- `review_log.jsonl` — 每次操作的 figure_hash + tool + timestamp
- `research-manifest.json` — 假设 / 数据集 / 声明 / 图的索引
- `chat_history.jsonl` — 对话记录（供审计追溯）

给定 manifest，任何图都可以**逐字节复现**。

### 自然语言改图

`edit_figure` 读取已有 `.py` 代码 → 追加修改指令 → 重新运行 → 新 SHA-256 hash 写入审计日志。无需手动找代码。

### 论文草稿

`paper-draft` 技能读取当前研究状态（假设 + 文献 + 数据 + 图 + 声明），按 JGR-Oceans 格式生成 Markdown 草稿。**严格不编造数据**——无证据时明确标注占位符。

## 使用