# DeepSeek API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 官方文档 | https://api-docs.deepseek.com/zh-cn/ |
| Base URL | `https://api.deepseek.com`（**不带 /v1**） |
| Chat 端点 | `POST https://api.deepseek.com/chat/completions` |
| 认证 | `Authorization: Bearer $DEEPSEEK_API_KEY`（Key 在 https://platform.deepseek.com/api_keys 创建） |
| OpenAI SDK | 兼容，设 `base_url="https://api.deepseek.com"` |
| Anthropic SDK | 兼容，`base_url="https://api.deepseek.com/anthropic"`（/v1/messages） |
| 前缀续写 Beta | `base_url="https://api.deepseek.com/beta"` |

## 模型 ID

| 模型 ID | 上下文 / 最大输出 | 备注 |
|---|---|---|
| `deepseek-flash` | 1M / 384K | DeepSeek-V4.1-Flash，当前主力；旧 ID `deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` 仍可调用，由 V4.1-Flash 服务、按 Flash 计价 |
| `deepseek-v4-pro` | 1M / 384K | DeepSeek-V4-Pro-0813，高价高质 |

注：旧文档中的 `deepseek-chat` / `deepseek-reasoner` 已不在当前官方文档模型枚举中（未找到）；无免费模型。

## 关键请求参数

| 参数 | 类型 / 范围 | 默认值 | 说明 |
|---|---|---|---|
| `temperature` | ≤2 | 1 | 思考模式下无效 |
| `top_p` | ≤1 | 1 | 仅思考模式有效，建议 0.95–1.0；非思考模式强制 1.0 |
| `max_tokens` | 1–393216 | 非思考 8K / 思考 64K | `reasoning_effort=max` 时默认 128K |
| `stop` | 最多 16 条 | null | |
| `stream` | bool | false | |
| `stream_options.include_usage` | bool | false | 须 `stream=true`，否则 400 |
| `response_format.type` | `text` / `json_object` | text | 无 json_schema |
| `logprobs` / `top_logprobs` | 0–20 | false / 0 | |
| `user_id` | string | — | 端用户追踪 |
| `frequency_penalty` / `presence_penalty` | — | — | 已废弃，传了无效 |
| `n` / `seed` | — | — | 官方文档未提及（未找到） |

## 工具调用（function calling）

- `tools`：仅 `type: "function"`；函数 `name` ≤128 字符；`strict` 为 Beta。
- `tool_choice`：`none` / `auto` / `required` / 指定函数对象。
- **互斥**：思考模式下 `tool_choice=required` 或指定函数返回 **400**。
- 多轮：回传 `assistant` 消息（含 `tool_calls`）+ `role:"tool"` 结果（带 `tool_call_id`）。

## 思考模式

```json
"thinking": {"type": "enabled", "reasoning_effort": "high"}
```

- `type`：`enabled`（默认）/ `disabled`。
- `reasoning_effort`：`none` / `low` / `high` / `max`，默认 `high`（旧值 minimal→low，medium/xhigh→high）。
- 响应中思考内容在 `reasoning_content` 字段；**多轮对话必须回传**，否则丢上下文。
- 思考模式下 `temperature`/`top_p` 基本不起作用，用 `reasoning_effort` 控制。

## 上下文缓存

- 硬盘缓存**默认开启**，按前缀单元匹配、"尽力而为"不保证命中。
- `usage` 返回 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`。
- 缓存构建秒级生效；闲置几小时~几天后清理。

## 计费（元 / 百万 tokens，闲时价，高峰翻倍）

| 模型 | 缓存命中 | 缓存未命中（输入） | 输出 |
|---|---|---|---|
| deepseek-flash | 0.02 | 1 | 4 |
| deepseek-v4-pro | 0.15 | 4.5 | 13.5 |

- 高峰时段：北京时间工作日 9:00–12:00、14:00–18:00；闲时半价。
- 账户赠送余额优先扣除。

## 限流与错误码

- 并发限制（账号粒度）：flash 2500、v4-pro 500；超限 **429**，可提工单免费扩容。
- 错误码：400 参数错误 / 401 认证失败 / **402 余额不足** / 422 参数校验 / 429 限流 / 500 / 503。

## 官方来源

- [文档首页](https://api-docs.deepseek.com/zh-cn/)
- [对话补全 API](https://api-docs.deepseek.com/zh-cn/api/create-chat-completion)
- [模型与价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)
- [并发限制](https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit)
- [错误码](https://api-docs.deepseek.com/zh-cn/quick_start/error_codes)
- [上下文硬盘缓存](https://api-docs.deepseek.com/zh-cn/guides/kv_cache)
- [Anthropic API 兼容](https://api-docs.deepseek.com/zh-cn/guides/anthropic_api)
