# 阶跃星辰 StepFun API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 官方文档 | https://platform.stepfun.com/docs |
| Base URL | `https://api.stepfun.com/v1`（**带 /v1**） |
| Chat 端点 | `POST https://api.stepfun.com/v1/chat/completions` |
| Step Plan 专属通道 | `POST https://api.stepfun.com/step_plan/v1/chat/completions`（`step-router-v1` 仅此通道可达） |
| Anthropic Messages 兼容 | `https://api.stepfun.com`（/v1/messages） |
| 认证 | `Authorization: Bearer $STEPFUN_API_KEY` + `Content-Type: application/json` |
| OpenAI SDK | 兼容，改 `base_url` 即可 |

## 模型 ID

| 模型 ID | 上下文 | 备注 |
|---|---|---|
| `step-5-preview` | 1M | 旗舰基模，支持文/图/视频输入 |
| `step-3.7-flash` | 256K | 多模态推理，low/medium/high 三档 |
| `step-3.5-flash` | 256K | |
| `step-3.5-flash-2603` | 256K | 仅 low/high 两档，Agent 场景优化 |
| `step-router-v1` | — | 智能路由（deepseek-v4-pro ↔ step-3.7-flash），仅 Step Plan 通道可达 |
| `step-1o-turbo-vision` | 32K | 视觉 |
| `stepaudio-3-chat-preview` / `stepaudio-3-realtime-preview` | — | 语音，**限时免费** |
| `stepaudio-2.5-chat` | — | 语音，仅文本输出 |
| `step-1o-audio` / `step-audio-2` / `step-audio-r1.5` | — | 语音对话 |
| TTS/ASR：`stepaudio-3-tts`、`stepaudio-2.5-tts`、`step-tts-mini`、`stepaudio-2.5-asr`、`stepaudio-2-asr-pro`、`step-asr` | — | 语音合成/识别 |

## 关键请求参数

| 参数 | 类型 / 范围 | 默认值 | 说明 |
|---|---|---|---|
| `temperature` | 0.0–2.0 | 0.5 | |
| `top_p` | (0,1) | 0.9 | |
| `max_tokens` | — | INF 不限 | Step Plan 通道上限 250K |
| `n` | 建议 ≤5 | 1 | |
| `stream` | bool | false | |
| `stop` | string 或数组 | null | |
| `frequency_penalty` | −2.0~2.0 | 0 | |
| `response_format` | `text` / `json_object` / `json_schema` | text | `strict` 默认 false |
| `reasoning_effort` | `low` / `medium` / `high` | medium | 思考强度 |
| `presence_penalty` / `seed` / `tool_choice` | — | — | 官方参数表未列出（未确认） |

## 工具调用

- `tools`：数组，`type: "function"`，含 `name` / `description` / `parameters`（JSON Schema）。
- 函数名正则：`^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$`。
- 响应返回 `tool_calls`；多轮回传 `role:"tool"` 消息 + `tool_call_id`。
- 内置 `web_search` 工具在 `step-5-preview` 上不可用，需改用 `/v1/search` 接口。

## 思考模式

- 无独立开关，用 `reasoning_effort` 控制强度。
- 思考内容在 `reasoning` 字段（流式为 `delta.reasoning`）；设 `reasoning_format="deepseek-style"` 可改从 `reasoning_content` 返回。
- 多模态输入：图片（URL/base64，`detail` low/high）、视频（mp4 <128M）、音频。
- 提示缓存：`usage.prompt_tokens_details.cached_tokens`，缓存命中单独计价。

## 计费、限流与订阅

- 按量计费（元/百万 tokens）：step-5-preview 输入 7 / 命中 0.7 / 输出 20；step-3.7-flash 1.35 / 0.27 / 8.1；step-3.5-flash 0.7 / 0.14 / 2.1。
- **注意**：step-5-preview 缓存价自 2026-10-14 起调整为 0.70。
- 限流按累计现金充值分 V0–V4：V0 并发 5 / RPM 100 / TPM 50 万；V4 130 / 2600 / 1300 万。需实名。
- Step Plan 订阅制：Credit 月池，1M Credit = ¥1，月末清零；¥49/99/199/699 档。
- 无新用户注册赠送额度；免费仅限 StepAudio 3 系列预览限时免费。

## 官方来源

- [文档中心](https://platform.stepfun.com/docs) / [llms.txt 索引](https://platform.stepfun.com/docs/llms.txt)
- [快速开始](https://platform.stepfun.com/docs/zh/quickstart/overview)
- [Chat Completions API](https://platform.stepfun.com/docs/zh/api-reference/chat/chat-completion-create)
- [Messages API（Anthropic 兼容）](https://platform.stepfun.com/docs/zh/api-reference/chat/messages-create)
- [模型列表](https://platform.stepfun.com/docs/zh/guides/models/list)
- [API 定价](https://platform.stepfun.com/docs/zh/guides/pricing/details) / [速率限制](https://platform.stepfun.com/docs/zh/guides/pricing/rate-limits)
- [推理模型实践](https://platform.stepfun.com/docs/zh/guides/developer/reasoning) / [工具调用](https://platform.stepfun.com/docs/zh/api-reference/tool-call)
- [Step Plan 概述](https://platform.stepfun.com/docs/zh/step-plan/overview) / [OpenAI 迁移](https://platform.stepfun.com/docs/zh/guides/developer/openai)
