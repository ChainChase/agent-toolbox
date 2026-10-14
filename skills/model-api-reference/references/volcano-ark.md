# 火山方舟（Volcano Ark / 豆包 Doubao）API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 官方文档 | https://www.volcengine.com/docs/82379（现跳转 docs.volcengine.com/docs/ark/*） |
| OpenAI 兼容端点 | `POST https://ark.cn-beijing.volces.com/api/v3/chat/completions` |
| 管控面 API | `https://ark.cn-beijing.volcesengineapi.com/` |
| 国际站（BytePlus ModelArk） | `https://ark.ap-southeast.bytepluses.com/api/v3` |
| Coding Plan 专属端点 | `https://ark.cn-beijing.volces.com/api/coding/v3` |
| 认证 | `Authorization: Bearer $ARK_API_KEY`（长效 Key 在控制台创建）；或 Access Key HMAC-SHA256 签名（此时 `model` 必须填 Endpoint ID） |

**两种调用方式**：
1. API Key + 模型名直接调用（如 `model="doubao-seed-2-1-pro-260915"`）。
2. 创建推理接入点后，用 `model="ep-xxxxx"` 调用（可固定版本与配置）。

## 模型 ID

| 模型 ID | 上下文 / 输出 | RPM / TPM | 备注 |
|---|---|---|---|
| `doubao-seed-evolving` | 1024K / 256K | 500 / 100 万 | 持续演进版 |
| `doubao-seed-2-1-pro-260915` | 1024K / 256K | 500 / 100 万 | 输入 6 元 / 输出 30 元每百万 token |
| `doubao-seed-2-1-lite-260915` | 1024K / — | 30000 / 500 万 | 输入 0.8 元 / 输出 2.7 元；音频输入 12 元 |
| `doubao-seed-2-1-turbo-260628` | 256K / — | — | 高速版 |
| `doubao-seed-2-0-lite-260428` | 256K 窗口（224K 输入 / 128K 输出） | — | 往期版本 |
| `doubao-seed-2-0-mini-260428` | 同上 | — | 往期版本 |

doubao-seed-2-1-pro-260915 缓存：命中 1.2 元/百万 token，缓存存储 0.017 元/百万 token/小时。完整列表以[模型列表](https://ark.volcengine.com/region:cn-beijing/docs/ark/model-list)为准。

## 关键请求参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `temperature` | 1.0 | |
| `top_p` | 0.7 | |
| `max_tokens` | 4096 | |
| `presence_penalty` / `frequency_penalty` | 0.0 | |
| `stop` | null | |
| `stream` | false | |
| `parallel_tool_calls` | true | false 时最多返回一个工具 |
| `service_tier` | auto | |
| `logprobs` / `top_logprobs` | false / 0 | |
| `prompt_cache_key` | — | 缓存路由 |
| `n` / `seed` | — | 官方参数表未列出（未确认） |

## 工具调用

- `tools`：`type: "function"`，支持 `strict` 模式。
- `tool_choice`：string 或 object。
- 流式工具调用：自 Doubao 1.5 起支持，需自行拼接 `delta.tool_calls`。

## 思考模式

```json
"thinking": {"type": "auto"},
"reasoning_effort": "high"
```

- `thinking.type`：`enabled`（默认）/ `disabled` / `auto`。
- `reasoning_effort`：七档 `none` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`；2.1 系列默认 `high`，`minimal` 关闭思考。

## 特殊能力

- `response_format` 结构化输出，官方推荐 `json_schema` 模式。
- 2.1 系列原生统一理解文本 / 视觉 / 音频。
- 缓存分显式 / 隐式，`usage` 返回 `cached_tokens`。

## 计费、限流与免费额度

- 按 token 后付费（元/百万 token），部分模型按输入长度分段计价；Flex 低优与批量推理约为常规价 50%。
- 限流按模型 RPM/TPM（见模型表）。
- 新用户"安心体验模式"赠 50 万 token：仅未开通过模型服务的账号可开启，用尽自动暂停、关闭后不可重开。
- 免费推理额度按模型独立计算、主账号共享。

## 官方来源

- [Chat API](https://ark.volcengine.com/region:cn-beijing/docs/ark/chat-api)
- [Base URL 及鉴权](https://ark.volcengine.com/region:cn-beijing/docs/ark/base-url-and-authentication)
- [模型列表](https://ark.volcengine.com/region:cn-beijing/docs/ark/model-list)
- [深度思考](https://ark.volcengine.com/region:cn-beijing/docs/ark/deep-thinking)
- [Function Calling](https://ark.volcengine.com/region:cn-beijing/docs/ark/function-calling)
- [模型价格](https://ark.volcengine.com/region:cn-beijing/docs/ark/model-pricing)
- [免费推理额度](https://ark.volcengine.com/region:cn-beijing/docs/ark/free-inference-quota)
- [安心体验模式细则](https://www.volcengine.com/docs/82379/1465347)
- [BytePlus ModelArk 国际站](https://docs.byteplus.com/en/docs/ModelArk/1928262)
