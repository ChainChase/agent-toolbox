# Qoder Agent SDK（TypeScript）API 速查

本文件供 CodeBuddy 在需要精确字段名/类型时加载，不替代 `SKILL.md` 的开发范式与示例。
包名：`@qoder-ai/qoder-agent-sdk`，运行环境 Node.js 18+。

## 1. 顶层导出（常用）

| 导出 | 用途 |
| :--- | :--- |
| `query(opts)` | 核心入口，返回异步消息迭代器（也是控制句柄） |
| `accessTokenFromEnv(name?)` | 从环境变量读 PAT（默认 `QODER_PERSONAL_ACCESS_TOKEN`） |
| `accessToken(token)` | 直接传入已获取的 PAT |
| `serviceAccount({ serviceAccountKey } \| { fetchServiceAccountToken })` | Service Account 认证 |
| `qodercliAuth()` | 复用本机 qodercli 登录态 |
| `tool(name, description, inputSchema, handler, extras?)` | 定义进程内 MCP 工具（TS 用 Zod raw shape） |
| `createSdkMcpServer({ name, version?, tools })` | 把工具注册为同进程 MCP server |
| 类型 `Query`、`CanUseTool`、`SDKUserMessage`、`SDKControlInitializeResponse`、`ServiceAccountTokenResult` 等 | 见 SDK References |

## 2. query() 的 options 字段

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `auth` | `Auth` | 必填，四选一（见上） |
| `cwd` | `string` | 工作目录，明确设置 |
| `model` | `string` | 模型选择 |
| `maxTurns` | `number` | 轮次上限 |
| `systemPrompt` | `{type:'preset',preset:'qodercli',append:string} \| string` | 追加或完全替换系统提示词 |
| `tools` | `string[]` | 本次会话可见工具集合 |
| `allowedTools` | `string[]` | 预授权工具（完整名，如 `mcp__s__t`） |
| `disallowedTools` | `string[]` | 禁止工具（deny 优先于 allow） |
| `permissionMode` | `'default'\|'acceptEdits'\|'plan'\|'dontAsk'\|'auto'\|'bypassPermissions'\|'yolo'` | 默认权限策略 |
| `allowDangerouslySkipPermissions` | `boolean` | 配合 bypassPermissions/yolo 显式确认 |
| `mcpServers` | `Record<string, McpServerConfig\|SdkMcpServer>` | 外部/进程内 MCP |
| `agents` | `Record<string, SubagentDef>` | 子 Agent 定义 |
| `skills` | `string[] \| 'all'` | 主会话 skill 上下文/调用；`[]` 禁用全部 |
| `settingSources` | `('user'\|'project'\|'local')[]` | CLI 扫描磁盘指令/skills 的范围；`[]` 沙箱 |
| `settings` | `object` | 静态权限/输出风格/skillOverrides 等（透传 CLI） |
| `hooks` | `object` | 生命周期钩子（PreToolUse/PermissionRequest/PermissionDenied/InstructionsLoaded 等） |
| `canUseTool` | `(toolName, input, ctx) => Promise<PermissionResult>` | 运行时审批回调（兼处理 AskUserQuestion） |
| `permissionPromptToolName` | `string` | 把审批交给外部 permission prompt tool（与 canUseTool 互斥） |
| `includePartialMessages` | `boolean` | 开启流式增量 `stream_event` |
| `additionalDirectories` | `string[]` | cwd 外可访问目录 |
| `sessionId` / `resume` / `continue` / `forkSession` | `string`/`string`/`boolean`/`boolean` | 会话持久化 |
| `abortController` | `AbortController` | 提前关闭会话 |
| `env` | `Record<string,string>` | 传给 qodercli 的环境变量（含 `QODER_CONFIG_DIR`） |
| `onAuthExpired` | `() => void` | 认证失败回调（每会话最多一次） |
| `plugins` | `Array<{type:'local', path}>` | 加载插件（含 plugin:skill） |
| `qodercli` | `string` | 显式指定 qodercli 可执行路径 |

## 3. 消息流类型（for await 消费）

| `message.type` | 关键字段 | 说明 |
| :--- | :--- | :--- |
| `system` | `subtype:'init'`, `session_id`, `skills` | 初始化握手；`init` 含 session_id 与发现清单 |
| `assistant` | `message.content[]`（block `text`/`tool_use`） | 模型文本与工具调用 |
| `task` | — | 任务/进度事件 |
| `stream_event` | `event.delta`（仅开启 `includePartialMessages`） | `text_delta` / `thinking_delta` / `input_json_delta` |
| `result` | `subtype`, `result` | 最终结果（含状态与用量） |
| `system` (subtype `permission_denied`) | `tool_name`, `message` | 权限被拒的结构化消息（dontAsk/auto 拒绝等） |

## 4. 工具定义（TS）

```ts
tool(
  name: string,                                  // server 内唯一
  description: string,                           // 给模型看：何时用/做什么/返回什么
  inputSchema: ZodRawShape,                      // 字段对象，非 z.object(...)
  handler: (args) => Promise<CallToolResult>,    // { content:[{type:'text',text}] } 或 { isError:true, content:[...] }
  extras?: { annotations?: { readOnlyHint?, destructiveHint?, openWorldHint?, title? } },
)
```

返回内容块：`text` / `image`(base64) / `audio`(base64) / `resource_link` / `resource`。
完整工具名：`mcp__{serverName}__{toolName}`。

## 5. 权限回调（canUseTool）

```ts
type CanUseTool = (
  toolName: string,
  input: Record<string, unknown>,
  ctx: { signal: AbortSignal; suggestions?: PermissionUpdate[]; title?; description?; toolUseID: string; agentID?; ... }
) => Promise<{
  behavior: 'allow' | 'deny';
  updatedInput?: Record<string, unknown>;
  message?: string;          // deny 必填
  toolUseID: string;
  updatedPermissions?: PermissionUpdate[]; // "本会话始终允许"
  interrupt?: boolean;       // deny 后中断 agent loop
}>;
```

`AskUserQuestion` 入参：`input.questions: { question, header, options:[{label,description,preview?}], multiSelect? }[]`
返回：`{ behavior:'allow', updatedInput:{ questions, answers: Record<questionText, label|自定义> } }`。
`answers` 单选用 label，多选用 `, ` 连接，取消返回 deny。

## 6. 子 Agent 定义

```ts
agents: {
  [name]: {
    description: string;
    prompt: string;
    tools?: string[];        // 完整工具名
    skills?: string[];       // 仅对该子 Agent 生效
    maxTurns?: number;
    model?: string;
    permissionMode?: string;
  }
}
```
主 Agent 通过 `Agent` 工具委派，子 Agent 输出作为工具结果返回。

## 7. MCP server 配置

- stdio：`{ command: string, args?: string[], env?: Record<string,string>, type?:'stdio' }`
- http：`{ type:'http', url: string, headers?: Record<string,string> }`
- sse：`{ type:'sse', url: string, headers?: Record<string,string> }`
- 进程内：`createSdkMcpServer({ name, version?, tools })` 直接作为 `mcpServers` 值。
- MCP tool policy（随 server 配置）：`tools:[{ name, permission_policy:'always_allow'|'always_ask'|'always_deny' }]`。

## 8. 权限模式语义

| mode | 行为 |
| :--- | :--- |
| `default` | 按 tools/allow/deny/回调/运行时策略处理 |
| `acceptEdits` | 自动接受文件编辑类操作 |
| `plan` | 计划模式，默认不执行实际变更 |
| `dontAsk` | 未预授权操作直接拒绝，不交互询问 |
| `auto` | 运行时自动判断 allow/deny（安全区内文件编辑可能自动放行） |
| `bypassPermissions`/`yolo` | 跳过检查，须 `allowDangerouslySkipPermissions:true` |

## 9. 会话控制方法（query 返回对象）

`setPermissionMode(mode)` · `interrupt()` · `cancelAsyncMessage(uuid): Promise<boolean>` ·
`initializationResult(): Promise<SDKControlInitializeResponse>` · `close()` ·
`reloadSkills()` · `reloadPlugins()` · `supportedCommands()`。

字段：`sessionId` 新建/fork 后新 ID；`resume` 恢复 ID；`continue:true` 接最近会话；
`forkSession:true` 配合 `resume` 派生；`env.QODER_CONFIG_DIR` 指定用户数据目录。
