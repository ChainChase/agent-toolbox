# 智谱 GLM API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 官方文档（国内） | https://docs.bigmodel.cn/cn/guide/start/introduction |
| 官方文档（国际） | https://docs.z.ai |
| Base URL | `https://open.bigmodel.cn/api/paas/v4`（**不带 /v1**） |
| Chat 端点 | `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 认证 | `Authorization: Bearer YOUR_API_KEY` |
| OpenAI SDK | 兼容，`base_url="https://open.bigmodel.cn/api/paas/v4/"`（需 openai SDK ≥1.0.0；经此路径 temperature 范围 (0,1)，`do_sample=false` 不适用） |
| Anthropic SDK | 兼容，`base_url="https://open.bigmodel.cn/api/anthropic"`，端点 `/v1/messages`，鉴权头 `x-api-key` |
| 国际站 | Base `https://api.z.ai/api/paas/v4`，chat 端点 `/api/paas/v4/chat/completions`，Key 在 z.ai 管理 |

## 模型 ID（文本模型默认 `glm-5.3`）

| 模型 ID | 上下文 / 最大输出 | 备注 |
|---|---|---|
| `glm-5.3` | 1M / 128K | 旗舰 |
| `glm-5.3-flash` | 1M / 128K | 原生多模态，速度快 |
| `glm-5.3-flashx` | 1M / 128K | 200 tok/s 高速版 |
| `glm-5.2` | 1M / 128K | |
| `glm-5.1` / `glm-5` / `glm-5-turbo` | 200K / 128K | |
| `glm-4.7` | 200K / 128K | |
| `glm-4.7-flashx` | 200K / 128K | 高速版 |
| `glm-4.6` | 200K / 128K | |
| `glm-4.5-air` / `glm-4.5-airx` | 128K / 96K | |
| `glm-4-long` | 1M / 4K | 长输入短输出 |
| `glm-4-flashx-250414` | 128K / 16K | |
| `glm-4.7-flash` | 200K / 128K | **免费** |
| `glm-4.5-flash` | 128K / 96K | **免费** |
| `glm-4-flash-250414` | 128K / 16K | **免费** |

视觉/多模态模型：`glm-5v-turbo`（200K/128K）、`glm-4.6v`（128K/32K）、`glm-4.6v-flash`（免费）、`glm-4.1v-thinking-flash(x)`、`glm-4v-flash`（免费）、`autoglm-phone`。

## 关键请求参数

| 参数 | 类型 / 范围 | 默认值 | 说明 |
|---|---|---|---|
| `temperature` | [0,1] | 1.0（GLM-4.5 系 0.6、GLM-4 系 0.75） | `do_sample=false` 时忽略 |
| `top_p` | [0.01,1] | 0.95 | 同上 |
| `do_sample` | bool | true | false 时 temperature/top_p 无效 |
| `max_tokens` | 文本模型最高 128K | 模型相关 | |
| `stop` | 最多 4 个 | null | |
| `stream` | bool | false | |
| `tool_stream` | bool | false | 仅 GLM-5.3/5.2/5.1/5/5-Turbo/4.7/4.6 |
| `request_id` / `user_id` | string | — | 追踪 |
| `frequency_penalty` / `presence_penalty` / `n` / `seed` | — | — | schema 中不存在（未找到） |

## 工具调用（function calling）

- `tools`：支持 `function` 类型，另支持 `retrieval` / `web_search` / `mcp` 类型。
- `function.name`：匹配 `^[a-zA-Z0-9_-]+$`，≤64 字符，最多 128 个工具。
- `tool_choice`：**默认且仅支持 `auto`**。
- 视觉模型仅 GLM-5.3 Flash 系列 / 4.6V / AutoGLM-Phone 支持 function tools。

## 思考模式

```json
"thinking": {"type": "enabled", "clear_thinking": true}
```

- `thinking.type`：`enabled`（默认）/ `disabled`，限 GLM-4.5 及以上；**GLM-5.3 / 5.3-Flash 不可关闭**（传 disabled 报错）。
- `thinking.clear_thinking`：默认 `true`；设 `false` 时多轮必须完整、有序回传 `reasoning_content`。
- `reasoning_effort`（GLM-5.2+）：`max` / `xhigh` / `high` / `medium` / `low` / `minimal` / `none`；GLM-5.3 仅 `low` / `high` / `max`。
- 思考内容返回在 `reasoning_content` 字段。

## 结构化输出

- `response_format={"type":"json_object"}`，仅文本模型。
- **不支持 json_schema / strict**（未找到）。

## 上下文缓存

- 隐式自动开启，无需参数；`usage.prompt_tokens_details.cached_tokens` 看命中量。
- 命中价约为标准输入价 50%；建议稳定前缀 ≥500 token；异步生效。

## 计费（元 / 百万 tokens）

| 模型 | 输入 | 输出 | 缓存命中 |
|---|---|---|---|
| GLM-5.3 | 8 | 28 | 2 |
| GLM-5.3-Flash | 0.8 | 2.8 | 0.23 |
| GLM-4.7-Flash 等 | 免费 | 免费 | — |

- 批处理半价。计费公式 = 未命中输入 + 命中输入 + 输出 + 缓存存储费（缓存存储限时免费）。

## 限流与错误码

- 按"同时处理中请求数"限流，无公开 QPS 数字，随权益等级提升；超限错误码 **1302 / 1305**。
- 常见错误码：1000/1001/1003(401 认证)、1113(429 欠费)、1210–1215(400 参数)、1261(prompt 过长)、1301(敏感内容)、1308/1309–1321(Coding Plan 各类限额)。

## 官方来源

- [平台介绍](https://docs.bigmodel.cn/cn/guide/start/introduction)
- [API 接入说明](https://docs.bigmodel.cn/cn/api/introduction)
- [模型概览](https://docs.bigmodel.cn/cn/guide/start/model-overview)
- [对话补全 API](https://docs.bigmodel.cn/cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8)
- [思考模式](https://docs.bigmodel.cn/cn/guide/capabilities/thinking)
- [上下文缓存](https://docs.bigmodel.cn/cn/guide/capabilities/cache)
- [结构化输出](https://docs.bigmodel.cn/cn/guide/capabilities/struct-output)
- [函数调用](https://docs.bigmodel.cn/cn/guide/capabilities/function-calling)
- [OpenAI 兼容](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction) / [Claude 兼容](https://docs.bigmodel.cn/cn/guide/develop/claude/introduction)
- [价格](https://docs.bigmodel.cn/cn/guide/start/pricing) / [限流](https://docs.bigmodel.cn/cn/api/rate-limit) / [错误码](https://docs.bigmodel.cn/cn/api/api-code)
- [国际站 Chat Completion](https://docs.z.ai/api-reference/llm/chat-completion)
