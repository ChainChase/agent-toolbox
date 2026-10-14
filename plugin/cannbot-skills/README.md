# CANNBot Skills（本地安装）

来源：[gitcode.com/cann/cannbot-skills](https://gitcode.com/cann/cannbot-skills)（master @ commit `5023e3ed`，2026-09-09），遵循官方"独立 Skill 安装"（Agent Skills 开放标准），以 Qoder 本地插件方式装载。

## 安装范围

`ops/` 与 `tools/` 两个域，共 **82 个技能**：

- **AscendC 核心**：ascendc-tiling-design、ascendc-api-best-practices、ascendc-precision-debug、ascendc-crash-debug、ascendc-runtime-debug、ascendc-sync-audit、ascendc-code-review、ascendc-perf-optimize、ascendc-st-design、ascendc-ut-develop、ascendc-env-check、直调/注册模板等 24 个
- **通用算子**：npu-arch、cann-env-setup、ops-precision-standard、ops-profiling、ops-simulator、ops-spec-gen、torch-ascendc-op-extension、torch-ops-profiler
- **其他算子框架**：catlass-*（3）、pypto-*（24）、tilelang-*（9）、triton-*（8）
- **CANN 工具链**：asys-toolkit、msaicerr-toolkit、msnpureport-toolkit

未安装：model/graph/runtime/infra 域与 plugins-official/plugins-community（编排层 Plugin 使用 AGENTS.md/workflow 格式，与 Qoder 插件规范不同；如需可后续补充复制对应 SKILL.md）。

## 更新方法

```bash
git -C /tmp/cannbot-skills pull        # 或重新克隆
# 同步 ops/ 与 tools/ 到 ~/.qoder-cn/plugins/custom/cannbot-skills/skills/
```

许可证：CANN Open Software License v2.0（见 LICENSE）。
