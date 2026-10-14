# opencode zen / opencode go API 接入参考

> 采集日期：2026-10-13（含当日实测）。关键决策前请以文末官方链接核对。
> 两者关系：**zen 是按量付费的模型聚合网关；go 是独立订阅服务**（不是 zen 上的一个模型 ID），模型 ID 带 `opencode-go/` 前缀，Base URL 也不同。

---

## 一、opencode zen（模型聚合网关）

### 接入信息

| 项 | 值 |
|---|---|
| 官网 | https://opencode.ai/zen |
| 文档 | https://opencode.ai/v2/docs/console/models/（旧 /docs/zen/ 跳转至此） |
| Base URL（公共端点） | `https://opencode.ai/zen/v1` |
| Base URL（现行文档） | `https://opencode.ai/inference/v1` |
| Chat 端点 | `/chat/completions`（OpenAI 兼容）、`/responses`、`/messages`（Anthropic 风格）、`/models/<id>`（Gemini 专用）、`/systemone`（Jev，非文本生成） |
| 模型列表 | `GET https://opencode.ai/inference/v1/models`（实测无需 Key 返回 83 个 ID） |
| 认证 | `Authorization: Bearer $OPENCODE_API_KEY`，Key 在 https://opencode.ai/auth 控制台加账单后创建 |
| 免费层匿名调用 | 空 `Authorization: Bearer`（非空无效 token 返 401） |

### 计费方式

- 无月费，按量付费：先充值；余额 <$5 自动充 $20；可设月度上限；刷卡手续费 4.4% + $0.30。
- 价格单位美元/百万 tokens（输入/输出），节选：

| 系列 | 模型 ID（输入/输出价） |
|---|---|
| Claude | `claude-sonnet-5-5`、`claude-sonnet-5` $2/$10；`claude-opus-5-5` $4/$20；`claude-opus-4-5`~`4-8`、`claude-opus-5` $5/$25；`claude-fable-5`、`-5-1` $10/$50；`claude-haiku-5-5` $0.10/$0.50；`claude-haiku-4-5` $1/$5；`claude-sonnet-4-5`、`4-6` $3/$15 |
| GPT | `gpt-5`、`5.1`、`5.1-codex` $1.07/$8.50；`gpt-5.2`、`5.2-codex`、`5.3-codex`、`5.3-codex-spark` $1.75/$14；`gpt-5.4` $2.50/$15；`gpt-5.5` $5/$30；`gpt-5.4-pro`、`5.5-pro` $30/$180；`gpt-5.6-luna` $0.20/$1.20；`gpt-5.6-terra` $2/$12；`gpt-5.6-sol` $4/$20；`gpt-6-luna` $0.10/$0.50；`gpt-6-sol`、`6.1-sol` $2/$10；`gpt-6-astra` $10/$50；另有 5-nano、5.1-codex-mini/max、5.4-mini/nano；>272K 上下文分档加价 |
| Grok | `grok-4.5`/`4.6`/`4.7` $2/$6（>200K $4/$12）；`grok-build-0.1` $1/$2 |
| DeepSeek | `deepseek-v4-flash` $0.14/$0.28；`deepseek-v4.1-flash` $0.30/$1.20；`deepseek-v4-pro` $1.74/$3.48 |
| Kimi | `kimi-k2.5` $0.60/$3；`kimi-k2.6`、`kimi-k2.7-code` $0.95/$4；`kimi-k3` $3/$15 |
| GLM | `glm-5` $1/$3.20；`glm-5.1`/`5.2`/`5.3` $1.40/$4.40；`glm-5.3-flash` $0.15/$0.50 |
| MiniMax | `minimax-m2.5`/`m2.7`/`m3` $0.30/$1.20 |
| Qwen | `qwen3.5-plus` $0.20/$1.20；`qwen3.8-flash` $0.15/$0.47；`qwen3.8-max` $2/$6（文档另有 3.6-plus、3.7-plus/max） |
| Muse / Gemini / Mistral | `muse-1.2`、`1.3` $1.25/$4.25；`gemini-3-flash` $0.50/$3、`3.1-pro` $2/$12、`3.5-flash` $1.50/$9、`3.5-flash-lite` $0.30/$2.50、`3.6/3.7/3.8-flash` $1.50/$7.50；`mistral-large-4` $0.68/$2.09 |
| LongCat | 仅免费版 |

### 免费模型（输入/输出/缓存读全免，多限时）

`big-pickle`、`space-bunny-free`、`cat-jam-free`、`longcat-2.5-preview-free`、`step-5-preview-free`、`exo-free`、`mimo-v2.6-flash-free`、`mimo-v2.5-free`、`ling-3.1-flash-free`、`ling-3.0-flash-fin-free`、`nemotron-3-ultra-free`、`nemotron-3.5-lightning-free`、`muse-spark-1.3-contributor-free`、`jev-1.13-free`（文档列 14 个，/models 实测在线 10 个）。

### 请求参数与工具调用

- 官方无 zen 专属参数文档；`temperature`/`top_p`/`max_tokens`/`stream`/`tools`/`tool_choice` 按各端点协议（OpenAI/Anthropic/Gemini/Responses）传入，**默认值未找到官方说明**。
- 工具调用：models.dev 注册表中抽样模型几乎全部 `tool_call=true`；`temperature` 固定的有 `gpt-5.5`、claude 系、`kimi-k3`，可调的有 deepseek/qwen/glm/minimax/grok/gemini/big-pickle。

### 使用限制（重要）

- **免费模型只能在 OpenCode 客户端内调用**：实测（2026-10-13）外部直接 POST `/zen/v1/chat/completions` 返回 `403 {"type":"FreeTierError","message":"OpenCode's free tier can only be used from within OpenCode..."}`。付费 API Key 通道不受此限，可任意客户端使用。
- RPM/TPM 速率限制数值官方未公布（未找到）。
- 隐私：模型托管美国；默认零保留不训练；例外——Nemotron 免费端点试用条款、Muse Spark Contributor 免费档用数据训练未来 Meta 模型、OpenAI/Anthropic 请求保留 30 天、DeepSeek ZDR 按月续期（至 2026-10-31）。

---

## 二、opencode go（订阅服务）

### 接入信息

| 项 | 值 |
|---|---|
| 官网/订阅页 | https://opencode.ai/console/go |
| 文档 | https://opencode.ai/docs/go/（跳转 https://opencode.ai/v2/docs/console/go/） |
| Base URL | `https://opencode.ai/inference/go/v1` |
| 端点 | `/chat/completions`、`/responses`、`/messages`、`/models` |
| 认证 | Console 订阅后复制 API key；OpenCode 内 `/connect` 选 OpenCode Go；环境变量 `OPENCODE_API_KEY` |
| 模型 ID 格式 | `opencode-go/<model-id>`（如 `opencode-go/kimi-k3`） |
| 价格 | Go $10/月（月额度约 $60）；Go Plus $40/月（月额度约 $180）；免费模型不限量 |

### 包含模型（33 个）

`grok-4.7`、`grok-4.6`、`gpt-6-luna`、`gpt-5.6-luna`、`claude-haiku-5-5`、`glm-5.3-flash`、`glm-5.3`、`glm-5.2`、`kimi-k3`、`kimi-k2.7-code`、`kimi-k2.6`、`longcat-2.0`、`longcat-2.5-preview-free`、`step-5-preview-free`、`mimo-v2.6-flash`、`mimo-v2.6-pro`、`mimo-v2.5`、`mimo-v2.5-pro`、`minimax-m3`、`minimax-m2.7`、`muse-spark-1.3-contributor`、`muse-spark-1.2-contributor`、`qwen3.8-max`、`qwen3.8-flash`、`qwen3.7-plus`、`deepseek-v4.1-flash`、`deepseek-v4-pro`、`deepseek-v4-flash`、`deepseek-v4-flash-vision-exp`、`hy4-preview`、`hy3`、`space-bunny`。

上下文长度（models.dev，全部 tool_call=true）：`kimi-k3` 1M/128K；`deepseek-v4-pro` 1M/384K；`glm-5.3` 1M/128K；`grok-4.7` 500K/500K；`space-bunny` 1M/512K；`claude-haiku-5-5` 1M/128K。

### 额度规则

- 按月度美元上限；每模型 5 小时窗口 = 月度 20%、每周 = 50%、每月 = 100%（如 Kimi K3 Go 档月上限 $15，Grok 4.7 Go Plus 档 $60）。
- `longcat-2.5-preview-free` 与 `step-5-preview-free` 无限量（限时）。
- 额度用完后仍可用免费模型，或开 "Use balance" 回落 Console 余额按量付费。
- Go/Go Plus token 单价相同（部分低于 zen 目录价，如 `deepseek-v4-pro` 输入 $0.66 vs zen $1.74）。

### 客户端限制

- 官方定位 "designed for OpenCode and other coding agents"；外部客户端需发送正常 coding-agent 流量、自定义 User-Agent（如 `my-coding-agent/1.0`），并在 `x-opencode-session` 头发送稳定会话 ID。
- 已验证客户端：Hermes、Claude Code、Codex、ZCode、Pi、jcode v0.81.6+、Kilo Code CLI；已知问题客户端：DeepSeek Harness、GitHub Copilot Chat、Kimi Code、MiMo Code。
- Go/Go Plus 仅限单成员工作区。

### 隐私

- 多数模型不训练、0 天保留；`grok-4.7`/`4.6`、`gpt-6-luna`、`gpt-5.6-luna`、`claude-haiku-5-5` 保留 30 天；Muse Spark contributor 档允许训练未来 Meta 模型；DeepSeek ZDR 按月续期至 2026-10-31。

## 官方来源

- [OpenCode Zen 官网](https://opencode.ai/zen) / [Console Models 文档](https://opencode.ai/v2/docs/console/models/) / [Zen 中文文档](https://opencode.ai/docs/zh-cn/zen/)
- [OpenCode Go 文档](https://opencode.ai/v2/docs/console/go/) / [Go 订阅页](https://opencode.ai/console/go)
- [models.dev API（opencode 官方注册表）](https://models.dev/api.json)
- 第三方补充（非官方）：[pi-opencode-zen 包文档](https://pi.dev/packages/pi-opencode-zen)、[Go 套餐整理](https://codingplan.org/plans/opencode-go)；403 FreeTierError 为 2026-10-13 实测结论
