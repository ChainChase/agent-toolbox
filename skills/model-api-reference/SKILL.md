---
name: model-api-reference
description: 主流大模型 API 平台接入参考手册。覆盖 DeepSeek、智谱 GLM、阿里云百炼（千问 Qwen）、火山方舟（豆包）、阶跃星辰 StepFun、小米 MiMo、opencode zen、opencode go 的 Base URL 与端点路径、认证方式、模型 ID 清单、temperature 等请求参数与默认值、工具调用（function calling）、思考/推理模式开关写法、计费与限流。当需要接入或调用这些平台的 API、编写或调试调用代码、查询某厂商的模型 ID/端点/参数/价格/限流/免费额度，或在多个平台间做选型对比时使用。
---

# model-api-reference — 主流大模型 API 接入参考

## 概述

收录 8 个主流大模型 API 提供平台的接入要点，全部整理自各厂商官方文档（采集日期 2026-10-13）。每个平台一个参考文档，放在 `references/` 下，按需加载，不要一次全读。

## 平台总览

| 平台 | 参考文档 | Base URL + chat completions 端点 | OpenAI 兼容 | 关键备注 |
|---|---|---|---|---|
| DeepSeek | `references/deepseek.md` | `https://api.deepseek.com/chat/completions` | 是（**不带 /v1**） | 另有 Anthropic 兼容端点；硬盘缓存默认开启 |
| 智谱 GLM | `references/glm.md` | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | 是（**不带 /v1**） | 国际站 `api.z.ai`；有免费模型 |
| 阿里云百炼（千问） | `references/dashscope-qwen.md` | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | 是 | API Key 按地域绑定；新用户有免费额度 |
| 火山方舟（豆包） | `references/volcano-ark.md` | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | 是 | 支持模型名直调或 `ep-xxxx` 接入点 |
| 阶跃星辰 StepFun | `references/stepfun.md` | `https://api.stepfun.com/v1/chat/completions` | 是 | Step Plan 订阅有独立通道 |
| 小米 MiMo | `references/mimo.md` | `https://api.xiaomimimo.com/v1/chat/completions` | 是（兼 Anthropic） | v2.5 系模型 2026-10-21 下线 |
| opencode zen | `references/opencode.md` | `https://opencode.ai/inference/v1/chat/completions` | 是 | 聚合 80+ 模型；免费模型仅限 opencode 客户端内调用 |
| opencode go | `references/opencode.md` | `https://opencode.ai/inference/go/v1/chat/completions` | 是 | 独立订阅（$10/月），模型 ID 带 `opencode-go/` 前缀 |

以上平台的 chat completions 认证统一为 `Authorization: Bearer <API_KEY>`（MiMo 还支持 `api-key` 头，二选一）。

## 使用指南

### 1. 通用调用模式

除特别注明外，所有平台都兼容 OpenAI Chat Completions 协议，用 OpenAI SDK 改 `base_url` 即可：

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.deepseek.com",      # 换成目标平台 Base URL（见总览表/各参考文档）
    api_key="<平台 API Key>",
)
resp = client.chat.completions.create(
    model="deepseek-flash",                   # 换成目标模型 ID
    messages=[{"role": "user", "content": "你好"}],
    temperature=0.7,
    tools=[{                                  # function calling，按需
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询城市天气",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        },
    }],
)
print(resp.choices[0].message)
```

**Base URL 是否带 `/v1` 不统一，是最常见的踩坑点**：DeepSeek、GLM 不带；百炼、火山方舟、阶跃、MiMo、opencode 带。各家 temperature 范围和默认值也不同（如 GLM 是 [0,1]，DeepSeek/阶跃上限 2.0，MiMo 上限 1.5），调用前查对应文档。

### 2. 选型速查

- **免费/低成本**：GLM 有常驻免费模型（glm-4.7-flash 等）；百炼新用户每模型约 100 万 token 免费额度（90 天）；火山方舟新用户 50 万 token 体验额度；opencode zen 有一批限时免费模型（但仅限 opencode 客户端内调用，外部调用返 403 FreeTierError）。
- **超长上下文**：qwen-long 10M；DeepSeek-flash / GLM-5.3 / MiMo-v2.6 / 豆包 seed 2.1 均为 1M。
- **推理/思考模型**：各家都支持，但开关写法各不相同（`thinking.type` / `enable_thinking` / `reasoning_effort`），且与 `temperature`、`tool_choice` 常有互斥，见各文档"思考模式"一节。
- **聚合网关**：opencode zen/go 用一个 Key 调 Claude/GPT/Grok/Kimi/GLM/DeepSeek/Qwen 等 80+ 模型，适合客户端产品接入。

### 3. 跨平台通用注意事项

- **思考模式互斥**：DeepSeek 思考模式下 `tool_choice=required` 或指定函数返回 400；MiMo 思考模式强制 `temperature=1.0/top_p=0.95`；GLM-5.3/5.3-Flash 不可关闭思考。
- **多轮回传**：工具调用后回传 `role:"tool"` + `tool_call_id`；思考模型多轮需回传 `reasoning_content`（GLM 设 `clear_thinking:false` 时尤其注意），否则可能 400 或丢上下文。
- **流式**：`stream=true` 时 `stream_options.include_usage` 可拿 token 用量（DeepSeek 在 `stream=false` 时传该字段会 400）；流式工具调用需拼接 `delta.tool_calls`。
- **计费单位**：均为元（或美元）/百万 tokens，区分输入/输出/缓存命中三档；DeepSeek、GLM 等有上下文缓存自动或显式命中折扣。

## 参考文档目录

| 文件 | 内容 | 何时读 |
|---|---|---|
| `references/deepseek.md` | 端点（无 /v1）、deepseek-flash/v4-pro、thinking 参数、前缀续写 Beta、缓存计费 | 接入 DeepSeek、查其模型 ID 或参数 |
| `references/glm.md` | paas/v4 端点、GLM-5.x 全系模型（含免费）、tool_stream、Coding Plan 错误码 | 接入智谱、查免费模型或国际站 z.ai |
| `references/dashscope-qwen.md` | compatible-mode 端点与地域差异、qwen3.8 系模型、enable_thinking/thinking_budget | 接入阿里云百炼、查千问模型 ID |
| `references/volcano-ark.md` | ark api/v3 端点、豆包 seed 2.1 模型名/ep-xxxx 两种调法、thinking/reasoning_effort | 接入火山方舟、查豆包模型 ID |
| `references/stepfun.md` | api.stepfun.com/v1、step-5/3.7/3.5、Step Plan 独立通道、reasoning_effort | 接入阶跃星辰、查 step 模型 ID |
| `references/mimo.md` | xiaomimimo.com/v1、mimo-v2.6/v2.5 系、max_completion_tokens、web_search 工具 | 接入小米 MiMo、查其模型 ID |
| `references/opencode.md` | zen 聚合网关（80+ 模型 ID 与价格、免费模型限制）与 go 订阅（$10/月、33 模型、额度规则） | 接入 opencode zen/go、查其模型 ID 与价格 |

## 时效性声明

本技能内容采集于 2026-10-13。模型上下架、价格、限流、免费额度规则变动频繁（如 MiMo v2.5 系已公告 2026-10-21 下线，阶跃 step-5-preview 缓存价 2026-10-14 起调整），关键决策前请以各参考文档末尾的官方文档链接在线核对。文档中标注"未找到"的信息表示官方文档未公布，不要臆造。
