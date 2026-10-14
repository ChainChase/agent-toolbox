# 阿里云百炼（DashScope / 千问 Qwen）API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 官方文档 | https://help.aliyun.com/zh/model-studio |
| OpenAI 兼容端点 | `{base_url}/chat/completions` |
| Base URL（国内北京） | `https://dashscope.aliyuncs.com/compatible-mode/v1`（推荐用业务空间专属域名 `https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`） |
| Base URL（新加坡·国际） | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Base URL（美国弗吉尼亚） | `https://dashscope-us.aliyuncs.com/compatible-mode/v1` |
| 原生 DashScope 接口 | `/api/v1`（非 OpenAI 格式） |
| Responses API | `{base_url}/responses` |
| Anthropic 兼容 | `/apps/anthropic` |
| 认证 | `Authorization: Bearer $DASHSCOPE_API_KEY`（Key 在百炼控制台获取） |

**注意：API Key 按地域绑定，跨地域调用返回 401 `invalid_api_key`。**

## 模型 ID（千问系为主，聚合了第三方模型）

| 模型 ID | 上下文 | 备注 |
|---|---|---|
| `qwen3.8-max` | 1M | 旗舰 |
| `qwen3.8-flash` | 1M | 高速低价 |
| `qwen3.7-plus` | 1M | |
| `qwen3.7-flash` | 1M | |
| `qwen-long` | 10M | 超长文档 |
| `qwen3.8-omni-flash` | 1M | 全模态（图文音视频） |
| `deepseek-v4-pro` | 1M | 平台托管 |
| `glm-5.2` | 1M | 平台托管 |
| `mimo-v2.5-pro` | 1M | 平台托管 |
| `kimi-k2.7-code` / `kimi-k2.5` | 256K | 平台托管 |
| `MiniMax-M3` | 192K | 平台托管 |

完整列表以[文本生成模型列表](https://help.aliyun.com/zh/model-studio/text-generation-model)为准。

## 关键请求参数

| 参数 | 类型 / 范围 | 默认值 | 说明 |
|---|---|---|---|
| `temperature` | [0,2) | 因模型而异：Qwen3.8 非思考 0.7、思考 0.6、DeepSeek 系 1.0 | |
| `top_p` | (0,1.0] | 0.8 / 0.95（因模型） | |
| `presence_penalty` | [-2,2] | 0 | |
| `seed` | [0, 2³¹−1] | 1234 | |
| `n` | 1–4 | 1 | |
| `stream` | bool | false | |
| `stream_options.include_usage` | bool | false | 流式末尾返回用量 |
| `max_tokens` | — | — | **即将废弃**，思考模型推荐 `max_completion_tokens`（含思维链） |
| `response_format` | `text` / `json_object` / `json_schema` | text | 支持 json_schema |

## 工具调用

- `tools`：`type: "function"`。
- `tool_choice`：`auto`（默认）/ `none` / `required`（**Qwen 模型不支持**）/ 指定 function。
- `parallel_tool_calls`：默认 `false`。
- `tool_stream`：控制复杂参数流式输出，仅 Qwen、GLM 模型支持。

## 思考模式

```json
"enable_thinking": true,
"thinking_budget": 4000
```

- `enable_thinking`：Python SDK 需经 `extra_body` 传入；Qwen3.8 等新模型默认开启。
- 思考内容在 `reasoning_content` 字段，`usage` 含 `reasoning_tokens`。
- `thinking_budget`：1–32768，控制台默认 4000。

## 上下文缓存与计费

- 显式上下文缓存：创建按输入价 125% 收费，命中按输入价 10% 收费。
- 按量付费，token 计费（元/百万 token），部分模型按输入长度阶梯计价。例：qwen3.7-plus 0–256K 档输入 2 元 / 输出 8 元。

## 限流与免费额度

- 限流按主账号 RPM/TPM；qwen3.8-max/flash 为按月消费动态限流（TPM 档位 500 万 / 1000 万 / 2000 万）。
- **新用户免费额度**：每模型约 100 万 token（总额超 7000 万），仅华北 2（北京）地域，有效期 90 天，自动发放。

## 官方来源

- [OpenAI 兼容总览](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)
- [Chat 参数参考](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)
- [Base URL 总览](https://www.alibabacloud.com/help/zh/model-studio/base-url)
- [深度思考](https://help.aliyun.com/zh/model-studio/deep-thinking)
- [文本生成模型列表](https://help.aliyun.com/zh/model-studio/text-generation-model)
- [限流](https://help.aliyun.com/zh/model-studio/rate-limit) / [动态限流](https://help.aliyun.com/zh/model-studio/quota-management)
- [新人免费额度](https://help.aliyun.com/zh/model-studio/new-free-quota)
- [模型调用价格](https://help.aliyun.com/zh/model-studio/model-pricing)
