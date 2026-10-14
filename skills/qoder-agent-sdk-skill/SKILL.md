---
name: qoder-agent-sdk-skill
description: 基于 Qoder Agent SDK（TypeScript 优先）开发领域 Agent 的专用指南。当用户要搭建、开发或扩展生产级领域 Agent（金融/医疗/办公/垂直行业助手等），涉及 @qoder-ai/qoder-agent-sdk 的认证、系统提示词定制、自定义工具（进程内 MCP）、外部 MCP、子 Agent、权限控制、流式输出、会话控制与 TS 开发范式时使用本技能。
agent_created: true
---

# Qoder 领域 Agent 开发指南（TypeScript 优先）

本技能提供基于 **Qoder Agent SDK** 开发领域 Agent（非通用编程助手）的端到端范式与可运行
代码示例。所有示例以 **TypeScript** 为主，包名为 `@qoder-ai/qoder-agent-sdk`，运行环境
Node.js 18+。需要逐字段速查 API 时，加载 `references/qoder-sdk-cheatsheet.md`；需要最小
可运行脚手架时，拷贝 `assets/domain-agent-starter/`。

## 何时使用本技能

- 把 Qoder 的 Harness（Agent 循环、工具执行、权限校验、会话管理）嵌入自有应用，构建
  生产级领域 Agent：金融/医疗合规助手、办公自动化、研发流水线、行业垂直 Agent。
- 需要以下任意能力：PAT/Service Account 认证、用系统提示词把通用模型改造成领域专家、
  用进程内 MCP 暴露内部业务工具、接入外部 MCP 服务、用子 Agent 委派子任务、精细权限与
  审批回调、流式打字机输出、会话持久化与恢复。
- 用户只说"用 Qoder SDK 写个客服/审查/分析 Agent""接入我们内部系统做 Agent"时，主动套用本技能。

## 一、核心心智模型（开发范式）

理解三层结构，避免把 SDK 当成单纯的函数调用库：

```
TypeScript / Python 应用（你的产品）
        │  query()：任务、选项、事件、控制指令
        ▼
     qodercli 运行时（Agent 循环 / 权限检查 / 工具执行）
        │           │
   Qoder 模型服务   本地文件 / 命令 / MCP / 子 Agent
```

关键范式：**保持 Harness，替换"大脑人格"**。领域 Agent = 预设 Harness + 你的
系统提示词 + 你的领域工具 + 你的权限边界。具体映射：

| 想改变什么 | 用什么能力 |
| :--- | :--- |
| 它是谁、做什么、输出风格 | `systemPrompt`（`preset` 追加 / 字符串完全替换） |
| 它能调用什么能力 | `tools` / `mcpServers`（进程内或外部 MCP）/ `agents`（子 Agent） |
| 它动之前谁说了算 | `permissionMode` / `allowedTools` / `disallowedTools` / `canUseTool` / `hooks` |
| 任务进行中要不要继续追问 | 单消息字符串 vs `AsyncIterable` 流式输入 |
| 输出是整段还是逐字 | `includePartialMessages` + `stream_event` |
| 跨进程/跨时间复用对话 | `sessionId` / `resume` / `continue` / `forkSession` |

三条铁律：
1. **认证永远走环境变量或密钥管理**，绝不在源码硬编码 PAT/Key。
2. **完全替换 `systemPrompt` 会移除预设安全约束**，必须同步配置 `permissionMode` 与工具白名单。
3. **SDK 内置 skills 默认被禁用**（`--disable-builtin-skills`），想要某内置能力需自己在
   plugin / setting sources 里复刻 SKILL.md，或通过 `skills: 'all'` 启用已发现的自定义 skills。

## 二、使用说明（快速开始）

### 1. 安装

```bash
npm install @qoder-ai/qoder-agent-sdk
# 自定义工具示例用 zod 定义入参 schema
npm install zod
```

### 2. 准备认证（推荐 PAT + 环境变量）

生成 PAT：登录 Qoder → Account → Integrations → 创建 PAT（生成后立即复制）。
生产/CI 用环境变量注入，开发机可直接复用本机 `qodercli` 登录态。

```bash
export QODER_PERSONAL_ACCESS_TOKEN="<your-qoder-personal-access-token>"
```

### 3. 最小可运行示例

创建 `agent.ts`，用 `npx tsx agent.ts` 或 `node --experimental-strip-types agent.ts` 运行：

```ts
import { accessTokenFromEnv, query } from '@qoder-ai/qoder-agent-sdk';

for await (const message of query({
  prompt: '分析代码库，找出缺少测试覆盖的函数并补写单元测试。',
  options: {
    auth: accessTokenFromEnv(),
    cwd: process.cwd(),
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    permissionMode: 'acceptEdits', // 自动放行文件编辑，仍对 Bash 等保持审慎
  },
})) {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'text') process.stdout.write(block.text);
      else if (block.type === 'tool_use') console.log(`\n[tool] ${block.name}`);
    }
  } else if (message.type === 'result') {
    console.log(`\n[done] ${message.subtype}`);
  }
}
```

`query()` 返回异步消息迭代器，消息类型见 `references/qoder-sdk-cheatsheet.md`。消费到
`result` 或迭代器抛错即代表本轮结束。

## 三、开发范式（TS 为主）

### 范式 1：项目结构

保持配置、提示词、工具、运行时控制分离，便于测试与复用：

```
src/
  agent.ts            # 组装 query()，消费消息流，对外暴露 run()
  config.ts           # 读取 env、认证方式、cwd、模型
  prompts/
    system.md         # 领域系统提示词（完全替换时用，TS 自行读取文件内容传入字符串）
  tools/
    order.ts          # 用 tool() 定义领域工具
    index.ts          # createSdkMcpServer 汇总成本会话 MCP server
  permissions.ts      # canUseTool 审批逻辑 / 风控接入
  ui/
    approval.ts       # 宿主侧审批与 AskUserQuestion 的 UI 适配
```

### 范式 2：系统提示词三层（推荐从最小改动开始）

- **追加到预设之后**（最稳）：保留 qodercli 的循环/工具/输出约束，只在末尾加规约。
  ```ts
  options: {
    systemPrompt: {
      type: 'preset',
      preset: 'qodercli',
      append: [
        '你是金融合规审查助手。',
        '只读取文件与运行只读命令，绝不修改工作区。',
        '用简体中文输出，结论按 CRITICAL / WARNING / INFO 标注。',
      ].join('\n'),
    },
  }
  ```
- **完全替换**（领域 Agent 常用）：字符串覆盖预设，去掉编程助手人格。
  ```ts
  options: {
    systemPrompt: `你是发布审查员。检查仓库并报告发现，可读取文件与运行只读命令，
    绝不修改工作树。用编号列表输出，每条标记 CRITICAL/WARNING/INFO。`,
  }
  ```
  > 完全替换会移除预设安全约束，必须同时配置权限边界（见范式 4）。
- **从文件系统加载指令**：用 `settingSources: ['user','project','local']` 让 CLI 读取仓库
  内指令文件；托管/多租户部署用 `settingSources: []` 保证行为可复现（TS 无文件形式，
  需自行 `readFileSync` 后以字符串传入）。

### 范式 3：工具设计

- 一个工具只做一类清晰动作，不要做"万能入口"。
- TypeScript 用 `tool()`，第三个参数传 **Zod raw shape**（字段对象，不是 `z.object(...)`）。
- 用 `annotations`（如 `readOnlyHint`）声明工具语义，便于调度/展示；它**不是**权限开关。
- 业务可预期失败返回 `{ isError: true, content: [...] }`；真正意外才抛异常。
- 注册到 `createSdkMcpServer`，完整工具名为 `mcp__{serverName}__{toolName}`。

```ts
import { createSdkMcpServer, tool } from '@qoder-ai/qoder-agent-sdk';
import { z } from 'zod';

const lookupOrder = tool(
  'lookup_order',
  '按订单 ID 查询订单状态。',
  { orderId: z.string().describe('订单号，例如 O-1001') },
  async ({ orderId }) => {
    const order = await orders.find(orderId);
    if (!order) {
      return { isError: true, content: [{ type: 'text', text: `未找到订单: ${orderId}` }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(order) }] };
  },
  { annotations: { readOnlyHint: true } },
);

export const orderTools = createSdkMcpServer({
  name: 'orders',
  version: '1.0.0',
  tools: [lookupOrder],
});
```

接入查询：

```ts
query({
  prompt: '查询订单 O-1001 的状态并一句话总结。',
  options: {
    auth: accessTokenFromEnv(),
    mcpServers: { orders: orderTools },
    allowedTools: ['mcp__orders__lookup_order'], // 必须用完整工具名
  },
});
```

### 范式 4：权限分层（纵深防御）

按"默认策略 → 工具范围 → 运行时审批 → 审计钩子"四层组合：

```ts
import { accessTokenFromEnv, query } from '@qoder-ai/qoder-agent-sdk';

const q = query({
  prompt: '检查仓库并报告风险，改文件前先请求批准。',
  options: {
    auth: accessTokenFromEnv(),
    cwd: process.cwd(),
    tools: ['Read', 'Grep', 'Bash', 'Write', 'Edit'],
    allowedTools: ['Read', 'Grep'],     // 预授权低风险工具
    disallowedTools: ['Bash'],          // 明确禁止高危工具（deny 优先于 allow）
    permissionMode: 'default',          // 未命中规则时进入审批回调
    async canUseTool(toolName, input, ctx) {
      const ok = await yourApprovalUI(toolName, input, ctx);
      return ok
        ? { behavior: 'allow', updatedInput: input, toolUseID: ctx.toolUseID }
        : { behavior: 'deny', message: '用户拒绝', toolUseID: ctx.toolUseID };
    },
  },
});
```

`permissionMode` 取值：`default` / `acceptEdits` / `plan` / `dontAsk` / `auto` /
`bypassPermissions`（需同时 `allowDangerouslySkipPermissions: true`，仅受信环境）/
`yolo`（`bypassPermissions` 别名）。高风险模式切忌用于无隔离环境。

### 范式 5：流式输出与 UI

开启 `includePartialMessages` 后，`stream_event` 携带 `event.delta`，类型有
`text_delta` / `thinking_delta` / `input_json_delta`，可实现打字机、实时渲染思考与工具入参。

```ts
const q = query({
  prompt: '写一份简短分析报告。',
  options: { auth: qodercliAuth(), includePartialMessages: true },
});

for await (const msg of q) {
  if (msg.type === 'stream_event') {
    const d = msg.event.delta;
    if (d?.type === 'text_delta') process.stdout.write(d.text);
    else if (d?.type === 'thinking_delta') process.stdout.write(d.thinking);
    else if (d?.type === 'input_json_delta') process.stdout.write(d.partial_json);
  }
}
```

### 范式 6：会话持久化与多轮

- 一次性任务：字符串 `prompt`，完成自动结束。
- 聊天/多轮：传 `AsyncIterable<SDKUserMessage>`，`priority` 控制插入时机（`now`/`next`/`later`），
  `shouldQuery: false` 仅补充上下文不触发回复。
- 持久化：`sessionId` 指定 ID；`resume` 按 ID 恢复；`continue: true` 接最近会话；
  `forkSession: true` 从 `resume` 派生新会话（原会话不受影响）。

### 范式 7：子 Agent 委派

把窄职责子任务委派给独立提示词/工具集的子 Agent，主 Agent 通过 `Agent` 工具调用：

```ts
query({
  prompt: '用订单支持子 Agent 查询 O-1001。',
  options: {
    auth: accessTokenFromEnv(),
    mcpServers: { orders: orderTools },
    allowedTools: ['Agent'],
    agents: {
      'order-support': {
        description: '处理订单查询并解读订单状态。',
        prompt: '你是订单支持子 Agent，使用订单工具清晰回答订单状态问题。',
        tools: ['mcp__orders__lookup_order'],
        maxTurns: 5,
      },
    },
  },
});
```

## 四、代码示例

### 示例 A：认证方式选择

```ts
import {
  accessTokenFromEnv, accessToken, serviceAccount, qodercliAuth, query,
} from '@qoder-ai/qoder-agent-sdk';

// 1) PAT（CI / 服务端，推荐环境变量）
query({ prompt: '...', options: { auth: accessTokenFromEnv() } });
//    自定义变量名：accessTokenFromEnv('MY_QODER_PAT')
// 2) 直接传入已获取的 PAT
query({ prompt: '...', options: { auth: accessToken(await readToken()) } });
// 3) Service Account（组织后端 / 定时任务）
query({ prompt: '...', options: { auth: serviceAccount({ serviceAccountKey: await readSecret('qoder-sa-key') }), cwd: process.cwd() } });
// 4) 复用本机 qodercli 登录态（仅开发机）
query({ prompt: '...', options: { auth: qodercliAuth() } });
```

### 示例 B：外部 MCP（stdio + http）

```ts
query({
  prompt: '读取项目 README 标题，并查询本月销售数据。',
  options: {
    mcpServers: {
      fs: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/project'] },
      analytics: {
        type: 'http',
        url: 'https://analytics.example.com/mcp',
        headers: { Authorization: `Bearer ${process.env.ANALYTICS_TOKEN}` },
      },
    },
  },
});
// stdio: { command, args?, env? }   http: { type:'http', url, headers? }   sse: { type:'sse', url, headers? }
```

### 示例 C：canUseTool 兼处理 AskUserQuestion

`AskUserQuestion` 经同一回调获取结构化答案；普通工具返回 allow/deny。

```ts
import { type CanUseTool, query } from '@qoder-ai/qoder-agent-sdk';

const canUseTool: CanUseTool = async (toolName, input, ctx) => {
  if (ctx.signal.aborted) return { behavior: 'deny', message: '请求已取消', toolUseID: ctx.toolUseID };

  if (toolName === 'AskUserQuestion') {
    const answers: Record<string, string> = {};
    for (const q of input.questions ?? []) {
      answers[q.question] = await yourQuestionUI(q); // 返回选项 label 或自定义文本
    }
    return { behavior: 'allow', updatedInput: { questions: input.questions, answers }, toolUseID: ctx.toolUseID };
  }

  const ok = await yourApprovalUI(toolName, input, ctx);
  return ok
    ? { behavior: 'allow', updatedInput: input, toolUseID: ctx.toolUseID }
    : { behavior: 'deny', message: '用户拒绝', toolUseID: ctx.toolUseID };
};

query({
  prompt: '检查项目并生成发布说明；遇到不确定的发布目标先问我。',
  options: {
    auth: accessTokenFromEnv(),
    tools: ['AskUserQuestion', 'Read', 'Write', 'Bash'],
    allowedTools: ['Read'],
    permissionMode: 'default',
    canUseTool,
  },
});
```

### 示例 D：会话控制（运行时方法）

`query()` 返回对象支持 `setPermissionMode` / `interrupt` / `cancelAsyncMessage` /
`initializationResult` / `close` / `reloadSkills` / `reloadPlugins` / `supportedCommands`。

```ts
import { randomUUID } from 'node:crypto';

const q = query({
  prompt: '检查项目中的所有文件。',
  options: { auth: accessTokenFromEnv(), sessionId: randomUUID(), abortController: new AbortController() },
});

const init = await q.initializationResult(); // 握手后读 session_id / skills / models
console.log(init.session_id, init.skills?.map((s) => s.name));
await q.setPermissionMode('default');
// await q.interrupt();                 // 停止当前回复但不结束会话
// await q.cancelAsyncMessage(uuid);   // 取消某条排队消息（需消息带 uuid）
try {
  for await (const m of q) {
    if (m.type === 'result') console.log(m.subtype);
  }
} finally {
  await q.close();
}
```

### 示例 E：多轮流式输入

```ts
import { type SDKUserMessage, query } from '@qoder-ai/qoder-agent-sdk';

async function* messages(): AsyncGenerator<SDKUserMessage> {
  yield { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '检查代码库安全问题。' }] }, parent_tool_use_id: null };
  await new Promise((r) => setTimeout(r, 2_000));
  yield { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '完成后生成简短报告。' }] }, parent_tool_use_id: null, priority: 'later' };
}

for await (const m of query({ prompt: messages(), options: { auth: accessTokenFromEnv(), allowedTools: ['Read', 'Glob', 'Grep'] } })) {
  if (m.type === 'result' && m.subtype === 'success') console.log(m.result);
}
```

完整可运行脚手架见 `assets/domain-agent-starter/agent.ts`。

## 五、常见陷阱

- 自定义工具白名单必须写完整名 `mcp__server__tool`，不是 `tool`。
- TypeScript `tool()` 第三参数是 **Zod raw shape**，传 `z.object(...)` 会报错。
- `canUseTool` 只收到"需要确认"的调用，已允许/已拒绝/普通日志看不到；要审计所有工具调用用 `hooks.PreToolUse`。
- `bypassPermissions`/`yolo` 必须显式 `allowDangerouslySkipPermissions: true`，否则拒绝。
- 完全替换 `systemPrompt` 后要自行加安全约束，否则 Agent 失去预设边界。
- SDK 默认禁用内置 skills；想要须用 `skills: 'all'` + `settingSources` 或自行复刻。
- 不要把 `skills` 当安全边界——沙箱由工具白名单、权限回调、权限模式、沙箱共同构成。
- `disallowedTools` 与 `allowedTools` 冲突时 **deny 优先**。
- 用 `AbortController` 或 `q.close()` 提前结束；`interrupt()` 只停当前回复、不关会话。

## 六、官方文档全链接列表

基础前缀：`https://docs.qoder.com/zh/cli/sdk/`

- 快速开始
  - 概述：https://docs.qoder.com/zh/cli/sdk/overview
  - 快速开始：https://docs.qoder.com/zh/cli/sdk/quick-start
  - 常见集成场景：https://docs.qoder.com/zh/cli/sdk/integration-scenarios
- 核心概念
  - 工作原理：https://docs.qoder.com/zh/cli/sdk/how-it-works
  - SDK 认证：https://docs.qoder.com/zh/cli/sdk/authentication
- 对话与会话
  - 对话与会话：https://docs.qoder.com/zh/cli/sdk/conversation
  - 输入模式：https://docs.qoder.com/zh/cli/sdk/input-modes
  - 流式输出：https://docs.qoder.com/zh/cli/sdk/streaming
  - 审批与用户输入：https://docs.qoder.com/zh/cli/sdk/approvals
  - 会话控制：https://docs.qoder.com/zh/cli/sdk/session-control
  - 外置会话存储：https://docs.qoder.com/zh/cli/sdk/external-session-storage
  - 文件快照与回滚：https://docs.qoder.com/zh/cli/sdk/snapshots
- 工具与扩展
  - 系统提示词：https://docs.qoder.com/zh/cli/sdk/system-prompt
  - Tools：https://docs.qoder.com/zh/cli/sdk/tools
  - MCP 集成：https://docs.qoder.com/zh/cli/sdk/mcp
  - Subagents：https://docs.qoder.com/zh/cli/sdk/subagents
  - Skills：https://docs.qoder.com/zh/cli/sdk/skills
  - Plugins：https://docs.qoder.com/zh/cli/sdk/plugins
- 控制与安全
  - 权限控制：https://docs.qoder.com/zh/cli/sdk/permissions
  - 安全扫描：https://docs.qoder.com/zh/cli/sdk/security-scanning
  - Hooks：https://docs.qoder.com/zh/cli/sdk/hooks
  - 模型选择：https://docs.qoder.com/zh/cli/sdk/model-selection
  - 成本和用量：https://docs.qoder.com/zh/cli/sdk/cost-usage
- 参考
  - 问题排查：https://docs.qoder.com/zh/cli/sdk/troubleshooting
  - 错误处理与错误码：https://docs.qoder.com/zh/cli/sdk/errors
  - SDK References：https://docs.qoder.com/zh/cli/sdk/reference
  - SDK References - TypeScript：https://docs.qoder.com/zh/cli/sdk/reference-ts
  - SDK References - Python：https://docs.qoder.com/zh/cli/sdk/reference-py
