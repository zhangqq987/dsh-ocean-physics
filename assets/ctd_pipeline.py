# -*- coding: utf-8 -*-
"""
CTD NetCDF 标准处理流水线
=========================
流程：
  1. xarray 读取 netCDF，查看变量名/坐标/属性
  2. 数据清洗：范围检查(QC)、剔除 NaN、去尖峰(spike)、保留单调下潜段
  3. 1 dbar 垂直 bin average（逐层平均）
  4. gsw 计算：SP -> SA -> CT -> sigma0（位密）
  5. 可视化：T-S 图（含等位密线）+ 温盐密垂直剖面图
  6. 混合层深度 MLD：密度判据(0.03 / 0.125 kg/m3)、温度判据(0.2 degC)

用法：
  python ctd_pipeline.py                # 无真实数据时：模拟生成温带冬季剖面再处理
  python ctd_pipeline.py --file xxx.nc  # 处理真实 CTD 观测文件

依赖：xarray netcdf4 gsw numpy scipy matplotlib
"""

import argparse
import os
import sys

# ----------------------------------------------------------------------
# Workaround: importing xarray triggers a scan of optional backend entry
# points, which imports `earthkit-data`, which hangs trying to lock its
# config file outside the sandbox-writable area.  Point it at a workspace
# config file where locking works.
# ----------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault("EARTHKIT_DATA_CONFIG_FILE",
                      os.path.join(_HERE, "earthkit_config.yaml"))

import numpy as np
import xarray as xr
import gsw
import scipy.signal as sig
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# ---------------- 0. 模拟生成温带冬季剖面（无真实数据时） ----------------

def simulate_winter_ctd(path="test_ctd.nc", lon=145.0, lat=40.0):
    """生成典型温带(40N,145E)冬季 CTD 剖面：0-500 dbar，0.5 dbar 采样。

    剖面形态：~15 C / 35.2 PSU 的充分混合层到 ~50 dbar，
    其下快速温跃层，500 dbar 处 ~4 C / 34.8 PSU。
    注入少量尖峰(传感器毛刺)和 NaN，以便展示清洗步骤。
    """
    p = np.arange(0.0, 500.5, 0.5)
    mld = 50.0

    def temp0(p):
        # 表面 15 C -> 500 dbar 4 C，混合层内近似等温
        d = np.maximum(p - mld, 0.0)
        return 4.0 + 11.0 * (1.0 - d / (500.0 - mld)) ** 1.8

    def salt0(p):
        return np.where(p <= mld, 35.2,
                        35.2 - 0.4 * (p - mld) / (500.0 - mld))

    rng = np.random.default_rng(42)
    t = temp0(p) + rng.normal(0, 0.01, p.size)
    s = salt0(p) + rng.normal(0, 0.004, p.size)

    # 注入 3 个温度尖峰和 2 个盐度尖峰（模拟传感器毛刺）
    for idx, amp in [(120, +0.45), (300, -0.60), (640, +0.38)]:
        t[idx] += amp
    for idx, amp in [(200, +0.06), (520, -0.05)]:
        s[idx] += amp
    # 注入 2 个 NaN（坏点）
    t[180] = np.nan
    s[470] = np.nan

    ds = xr.Dataset(
        {
            "temperature": ("pressure", t, {
                "units": "degrees_C", "long_name": "Sea temperature",
                "standard_name": "sea_water_temperature"}),
            "salinity": ("pressure", s, {
                "units": "PSU", "long_name": "Practical salinity",
                "standard_name": "sea_water_practical_salinity"}),
        },
        coords={
            "pressure": ("pressure", p, {
                "units": "dbar", "long_name": "Sea pressure",
                "standard_name": "sea_water_pressure"}),
            "longitude": lon, "latitude": lat,
        },
        attrs={
            "title": "Simulated temperate-winter CTD profile",
            "description": ("Synthetic downcast with spikes/NaN for QC demo: "
                            "T 15->4 C, S 35.2->34.8, 0-500 dbar, 0.5 dbar step"),
            "institution": "DSH demo", "Conventions": "CF-1.8",
        },
    )
    ds.to_netcdf(path)
    print(f"[simulate] raw profile saved -> {path} "
          f"({ds.sizes['pressure']} samples)")
    return ds

# ---------------- 1. xarray 读取 ----------------

def read_ctd(path):
    ds = xr.open_dataset(path, engine="netcdf4")
    print("\n================ 1. 读取 NetCDF ================")
    print(f"file : {path}")
    print(f"dims : {dict(ds.sizes)}")
    print("data_vars:", list(ds.data_vars))
    print("coords   :", list(ds.coords))
    print("attrs    :", dict(ds.attrs))
    for v in ds.data_vars:
        print(f"  - {v}: units={ds[v].attrs.get('units')}, "
              f"dtype={ds[v].dtype}, n={ds[v].size}")
    return ds

# ---------------- 2. 数据清洗 ----------------

def clean_ctd(ds, T_RANGE=(-2.0, 35.0), S_RANGE=(0.0, 42.0)):
    print("\n================ 2. 数据清洗 ================")
    n0 = ds.sizes["pressure"]
    stats = {}

    # (a) 去掉上升段：只保留压强单调递增的段（下潜段）
    p = ds.pressure.values
    mono = np.r_[True, np.diff(p) > 0]
    ds = ds.isel(pressure=mono)
    stats["upcast_removed"] = n0 - ds.sizes["pressure"]

    # (b) 物理范围检查（QC 下限/上限）
    t_ok = (ds.temperature >= T_RANGE[0]) & (ds.temperature <= T_RANGE[1])
    s_ok = (ds.salinity >= S_RANGE[0]) & (ds.salinity <= S_RANGE[1])
    p_ok = ds.pressure >= 0
    mask = t_ok & s_ok & p_ok
    stats["range_removed"] = int((~mask).sum())
    ds = ds.where(mask, drop=True)

    # (c) 剔除 NaN
    n_nan = int(ds.temperature.isnull().sum()) + int(ds.salinity.isnull().sum())
    ds = ds.dropna(dim="pressure", how="any")
    stats["nan_removed"] = n_nan

    # (d) 去尖峰：与 5 点中值滤波比较，偏差超过阈值视为毛刺
    for var, thresh in [("temperature", 0.25), ("salinity", 0.03)]:
        med = sig.medfilt(ds[var].values, kernel_size=5)
        spike = np.abs(ds[var].values - med) > thresh
        ds = ds.isel(pressure=~spike)
        stats[f"spike_removed_{var}"] = int(spike.sum())

    print(f"raw samples : {n0}")
    for k, v in stats.items():
        print(f"  removed ({k:18s}): {v}")
    print(f"clean samples: {ds.sizes['pressure']}")
    return ds

# ---------------- 3. 1 dbar bin average ----------------

def bin_average(ds, db=1.0):
    print("\n================ 3. 1 dbar bin average ================")
    pmin, pmax = float(ds.pressure.min()), float(ds.pressure.max())
    edges = np.arange(np.floor(pmin), np.ceil(pmax) + db, db)
    labels = edges[:-1] + db / 2.0  # bin 中心
    dsb = (ds.groupby_bins("pressure", bins=edges, labels=labels)
             .mean(dim="pressure")
             .rename({"pressure_bins": "pressure"}))
    # groupby 会丢掉标量坐标，补回
    for c in ds.coords:
        if c not in dsb.coords and ds[c].ndim == 0:
            dsb = dsb.assign_coords({c: ds[c].values})
    print(f"binned levels: {dsb.sizes['pressure']} "
          f"({db:g} dbar bins, {pmin:.1f}-{pmax:.1f} dbar)")
    return dsb

# ---------------- 4. gsw：SA / CT / sigma0 ----------------

def gsw_thermo(dsb):
    print("\n================ 4. gsw 热力学计算 ================")
    lon = float(dsb.longitude.values) if "longitude" in dsb else 0.0
    lat = float(dsb.latitude.values) if "latitude" in dsb else 0.0
    p = dsb.pressure.values

    SA = gsw.SA_from_SP(dsb.salinity.values, p, lon, lat)   # 绝对盐度 g/kg
    CT = gsw.CT_from_t(SA, dsb.temperature.values, p)       # 保守温度 degC
    sigma0 = gsw.sigma0(SA, CT)                             # 位密异常 kg/m3

    dsb = dsb.assign(
        SA=(("pressure",), SA, {"units": "g/kg", "long_name": "Absolute salinity"}),
        CT=(("pressure",), CT, {"units": "degC", "long_name": "Conservative temperature"}),
        sigma0=(("pressure",), sigma0, {"units": "kg/m3",
                 "long_name": "Potential density anomaly (ref 0 dbar)"}),
    )
    print(f"lon/lat used for SA: {lon}, {lat}")
    print(f"surface: SA={SA[0]:.4f} g/kg, CT={CT[0]:.3f} C, sigma0={sigma0[0]:.3f}")
    print(f"bottom : SA={SA[-1]:.4f} g/kg, CT={CT[-1]:.3f} C, sigma0={sigma0[-1]:.3f}")
    return dsb

# ---------------- 5. 绘图 ----------------

def plot_ts(dsb, out="test_ctd_ts_diagram.png"):
    print("\n================ 5. 绘图 ================")
    lon = float(dsb.longitude.values) if "longitude" in dsb else 0.0
    lat = float(dsb.latitude.values) if "latitude" in dsb else 0.0

    fig, ax = plt.subplots(figsize=(7.4, 6.2))
    # 等位密线（用 gsw 在 p=0 参考面计算）
    Sg = np.linspace(34.6, 35.4, 240)
    Tg = np.linspace(2.0, 16.0, 240)
    SS, TT = np.meshgrid(Sg, Tg)
    SA_g = gsw.SA_from_SP(SS, 0.0, lon, lat)
    CT_g = gsw.CT_from_t(SA_g, TT, 0.0)
    sig_g = gsw.sigma0(SA_g, CT_g)
    cs = ax.contour(SS, TT, sig_g, levels=np.arange(24.5, 28.5, 0.5),
                    colors="0.5", linewidths=0.7, linestyles="--")
    ax.clabel(cs, inline=True, fontsize=8, fmt="%.1f")

    sc = ax.scatter(dsb.salinity, dsb.temperature, c=dsb.pressure,
                    cmap="viridis", s=26, edgecolors="k", linewidths=0.3, zorder=5)
    cb = fig.colorbar(sc, ax=ax, label="Pressure (dbar)")
    cb.ax.invert_yaxis()

    ax.set_xlabel("Practical Salinity (PSU)")
    ax.set_ylabel("In-situ Temperature (°C)")
    ax.set_title(f"T-S Diagram (sigma0 isopycnals)  [{lat:.0f}N, {lon:.0f}E]")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    print(f"T-S diagram -> {out}")
    plt.close(fig)

def plot_profile(dsb, mld_dict, out="test_ctd_profile.png"):
    fig, axes = plt.subplots(1, 3, figsize=(13, 6.2), sharey=True)
    p = dsb.pressure.values
    ylim = (p.max() + 5, -5)

    axes[0].plot(dsb.temperature, p, "r-", lw=1.2)
    axes[0].set_xlabel("Temperature (°C)")
    axes[0].set_ylabel("Pressure (dbar)")
    axes[0].invert_yaxis()
    axes[0].grid(alpha=0.3)

    axes[1].plot(dsb.salinity, p, "b-", lw=1.2)
    axes[1].set_xlabel("Practical Salinity (PSU)")
    axes[1].grid(alpha=0.3)

    axes[2].plot(dsb.sigma0, p, "g-", lw=1.2)
    axes[2].set_xlabel(r"$\sigma_0$ (kg/m$^3$)")
    axes[2].grid(alpha=0.3)

    for ax in axes:
        ax.set_ylim(ylim)

    # 标注混合层深度
    for key, (mld, color, ls) in mld_dict.items():
        if mld is not None and np.isfinite(mld):
            axes[0].axhline(mld, color=color, ls=ls, lw=1.0, alpha=0.85)
            axes[2].axhline(mld, color=color, ls=ls, lw=1.0, alpha=0.85)
    axes[0].set_title("Temperature")
    axes[1].set_title("Salinity")
    axes[2].set_title(r"$\sigma_0$")
    fig.suptitle("CTD Profile — simulated temperate winter (0-500 dbar)")
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    print(f"Profile plot -> {out}")
    plt.close(fig)

# ---------------- 6. 混合层深度 ----------------

def mixed_layer_depth(dsb):
    print("\n================ 6. 混合层深度 (MLD) ================")
    p = dsb.pressure.values
    P_REF = 10.0

    def first_below(cond):
        """从 10 dbar 向下找第一个满足条件的位置（避免表层噪声）"""
        sel = dsb.pressure.where((dsb.pressure >= P_REF) & cond).values
        sel = sel[np.isfinite(sel)]
        return float(sel[0]) if sel.size else np.nan

    # (a) 密度判据 (Levitus): sigma0 >= sigma0(10 dbar) + 0.125
    s_ref = float(dsb.sigma0.sel(pressure=P_REF, method="nearest"))
    mld_d125 = first_below(dsb.sigma0 >= s_ref + 0.125)
    # (b) 密度判据 (常用阈值 0.03 kg/m3)
    mld_d03 = first_below(dsb.sigma0 >= s_ref + 0.03)
    # (c) 温度判据: T <= T(10 dbar) - 0.2
    t_ref = float(dsb.temperature.sel(pressure=P_REF, method="nearest"))
    mld_t = first_below(dsb.temperature <= t_ref - 0.2)

    print(f"sigma0(10 dbar) = {s_ref:.3f} kg/m3, T(10 dbar) = {t_ref:.2f} C")
    print(f"  MLD (density +0.125 kg/m3) : {mld_d125:6.1f} dbar")
    print(f"  MLD (density +0.030 kg/m3) : {mld_d03:6.1f} dbar")
    print(f"  MLD (temp -0.2 C)          : {mld_t:6.1f} dbar")
    return {"density(0.125)": (mld_d125, "crimson", "-"),
            "density(0.03)": (mld_d03, "darkorange", ":"),
            "temperature": (mld_t, "purple", "--")}

# ---------------- main ----------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default=None, help="真实 CTD netCDF 路径")
    ap.add_argument("--out", default="test_ctd", help="输出文件名前缀")
    args = ap.parse_args()

    if args.file:
        ds = read_ctd(args.file)
    else:
        print("\n[info] 未提供真实数据文件 -> 模拟生成温带冬季剖面")
        ds = simulate_winter_ctd()
        ds = read_ctd("test_ctd.nc")

    ds = clean_ctd(ds)
    dsb = bin_average(ds)
    dsb = gsw_thermo(dsb)

    # 保存处理后的 netCDF（含 sigma0）
    out_nc = args.out + "_processed.nc"
    dsb.to_netcdf(out_nc)
    print(f"\n[info] processed dataset -> {out_nc}")

    plot_ts(dsb, out=args.out + "_ts_diagram.png")
    mld_dict = mixed_layer_depth(dsb)
    plot_profile(dsb, mld_dict, out=args.out + "_profile.png")

    print("\n================ 汇总 ================")
    print(dsb[["temperature", "salinity", "sigma0"]]
          .to_dataframe().describe().round(3))

if __name__ == "__main__":
    main()
