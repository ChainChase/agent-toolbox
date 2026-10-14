# 小米 MiMo API 接入参考

> 采集日期：2026-10-13。关键决策前请以文末官方文档链接核对。

## 接入信息

| 项 | 值 |
|---|---|
| 开放平台控制台 | https://platform.xiaomimimo.com |
| 文档站 | https://mimo.mi.com/docs |
| Base URL | `https://api.xiaomimimo.com/v1`（**带 /v1**） |
| Chat 端点 | `POST https://api.xiaomimimo.com/v1/chat/completions` |
| Anthropic 兼容 | `https://api.xiaomimimo.com/anthropic`（/v1/messages） |
| Batch API | `https://batch-api-cn.xiaomimimo.com/v1` |
| Token Plan API | `https://token-plan-cn.xiaomimimo.com/v1` |
| 认证 | `api-key: $MIMO_API_KEY` **或** `Authorization: Bearer $MIMO_API_KEY`（二选一）+ `Content-Type: application/json` |
| Key 前缀 | `sk-`（按量）/ `tp-`、`ttp-`（套餐） |
| OpenAI SDK | 兼容；同时兼容 Anthropic SDK |
| 开源权重 | https://github.com/xiaomimimo/MiMo |

## 模型 ID

| 模型 ID | 上下文 / 输出 | 备注 |
|---|---|---|
| `mimo-v2.6-pro` | 1M / 128K | 全模态理解，主力 |
| `mimo-v2.6-flash` | 1M / 128K | 高频大规模任务 |
| `mimo-v2.6-pro-ultraspeed` | 1M / 128K | 实时敏感场景，定制服务 |
| `mimo-v2.5-pro` | 1M / 128K | **2026-10-21 10:00（北京时间）下线** |
| `mimo-v2.5` | 1M / 128K | **2026-10-21 10:00（北京时间）下线** |
| `mimo-v2.5-asr` | 8K / 2K | 中英语音识别 |
| `mimo-v2.5-tts` / `-voiceclone` / `-voicedesign` | 8K / 8K | 语音合成，限时免费 |

## 关键请求参数

| 参数 | 类型 / 范围 | 默认值 | 说明 |
|---|---|---|---|
| `temperature` | [0,1.5] | 1.0 | 思考模式下强制 1.0 |
| `top_p` | [0.01,1.0] | 0.95 | 思考模式下强制 0.95 |
| `max_completion_tokens` | [1,131072] | v2.6 与 v2.5-pro 默认 131072；v2.5 默认 32768 | **含思考+回答总量**；注意不是 `max_tokens` |
| `stop` | 最多 4 条 | null | |
| `stream` | bool | false | |
| `frequency_penalty` / `presence_penalty` | [−2,2] | 0 | |
| `response_format` | `text` / `json_object` | text | **无 json_schema**；需在消息中指示输出 JSON |
| `n` / `seed` / `max_tokens` | — | — | 官方文档未列出（未确认） |

## 工具调用

- `tools`：支持 `function` 与 `web_search` 两类。
- `web_search`：需开通插件；`force_search` 默认 false。
- `tool_choice`：**仅支持 `auto`**，传其他值会被后端移除并按 auto 处理。
- **思考模式多轮工具调用必须回传历史 `reasoning_content`，否则 400。**

## 思考模式

```json
"thinking": {"type": "enabled"}
```

- 全部 5 个文本模型**默认开启**。
- 思考过程经 `reasoning_content` 返回。
- 思考模式下 `temperature`/`top_p` 被强制为 1.0 / 0.95。
- 多模态：user/tool 消息支持 `image_url`、`input_audio`、`video_url`（视频 `fps` 0.1–10，默认 2）。
- 上下文缓存：命中低价，缓存写入限时免费。

## 计费与限流

- 按量计费（国内 RMB / 百万 tokens）：

| 模型 | 输入 | 缓存命中 | 输出 |
|---|---|---|---|
| mimo-v2.6-pro | 3.00 | 0.025 | 6.00 |
| mimo-v2.6-flash | 1.00 | 0.02 | 2.00 |
| mimo-v2.6-pro-ultraspeed | 30 | 0.25 | 60 |

- Batch 半价；ASR ¥0.5/小时；联网搜索 ¥16/千次。海外 USD 计价。
- 限流按账号 × 模型：文本模型 100 RPM / 10M TPM；ASR 100 RPM / 10K TPM；TTS 100 RPM / 10M TPM。
- 无新用户注册赠送额度；优惠为推荐返利（邀请人得好友实付 10%–20% credits、好友首单 9 折，credits 40 天有效、不可购 Token Plan）。Token Plan 订阅另计。

## 官方来源

- [MiMo 开放平台控制台](https://platform.xiaomimimo.com) / [文档站](https://mimo.mi.com/docs)
- [OpenAI Chat Completion API](https://mimo.mi.com/static/docs/api/chat/openai-api.md)
- [首次调用](https://mimo.mi.com/static/docs/quick-start/summary/first-api-call.md)
- [模型列表](https://mimo.mi.com/static/docs/quick-start/summary/model.md)
- [超参数](https://mimo.mi.com/static/docs/api/guidance/model-hyperparameters.md)
- [速率限制](https://mimo.mi.com/static/docs/api/guidance/rate-limit.md)
- [按量计费](https://mimo.mi.com/static/docs/price/pay-as-you-go.md)
- [深度思考](https://mimo.mi.com/static/docs/quick-start/usage-guide/text-generation/deep-thinking.md)
- [推荐返利](https://mimo.mi.com/static/docs/quick-start/promotions/refer.md)
- [MiMo GitHub 开源仓库](https://github.com/xiaomimimo/MiMo)
