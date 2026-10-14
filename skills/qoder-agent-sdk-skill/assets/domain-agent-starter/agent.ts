/**
 * Qoder Agent SDK 领域 Agent 最小可运行脚手架（TypeScript）
 *
 * 运行前：
 *   1) npm install
 *   2) export QODER_PERSONAL_ACCESS_TOKEN="<你的 PAT>"
 *   3) npm start
 *
 * 这个例子演示"保持 Harness、替换人格"的核心范式：
 *   - systemPrompt 把通用模型改造成"发布审查员"（领域 Agent）
 *   - 自定义工具（进程内 MCP）暴露内部订单查询能力
 *   - 权限分层：预授权只读工具，Bash 走审批回调
 *   - 消费消息流，支持 result / assistant / stream_event
 */

import { accessTokenFromEnv, createSdkMcpServer, query, tool, type CanUseTool } from '@qoder-ai/qoder-agent-sdk';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. 领域工具（进程内 MCP）
// ---------------------------------------------------------------------------
const lookupOrder = tool(
  'lookup_order',
  '按订单 ID 查询订单状态。',
  { orderId: z.string().describe('订单号，例如 O-1001') },
  async ({ orderId }) => {
    // 这里替换为真实后端调用，例如 await db.orders.findById(orderId)
    const fakeDb: Record<string, unknown> = {
      'O-1001': { orderId: 'O-1001', status: 'shipped', eta: '2026-05-20' },
    };
    const order = fakeDb[orderId];
    if (!order) {
      return { isError: true, content: [{ type: 'text', text: `未找到订单: ${orderId}` }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(order) }] };
  },
  { annotations: { readOnlyHint: true } },
);

const orderTools = createSdkMcpServer({ name: 'orders', version: '1.0.0', tools: [lookupOrder] });

// ---------------------------------------------------------------------------
// 2. 审批回调（普通工具 + AskUserQuestion 统一入口）
// ---------------------------------------------------------------------------
const canUseTool: CanUseTool = async (toolName, input, ctx) => {
  if (ctx.signal.aborted) {
    return { behavior: 'deny', message: '请求已取消', toolUseID: ctx.toolUseID };
  }
  if (toolName === 'AskUserQuestion') {
    const answers: Record<string, string> = {};
    for (const q of (input.questions ?? []) as Array<{ question: string }>) {
      // 实际项目里替换成你的 UI / 审批服务
      answers[q.question] = '（示例答案，请接入真实交互）';
    }
    return { behavior: 'allow', updatedInput: { questions: input.questions, answers }, toolUseID: ctx.toolUseID };
  }
  // 示例：默认拒绝高风险工具，真实场景接入风控/人工审批
  const approved = false;
  return approved
    ? { behavior: 'allow', updatedInput: input, toolUseID: ctx.toolUseID }
    : { behavior: 'deny', message: '示例拒绝：请接入审批 UI', toolUseID: ctx.toolUseID };
};

// ---------------------------------------------------------------------------
// 3. 组装并运行
// ---------------------------------------------------------------------------
const q = query({
  prompt: '查询订单 O-1001 的状态并一句话总结。',
  options: {
    auth: accessTokenFromEnv(),
    cwd: process.cwd(),
    // 完全替换系统提示词：把通用模型改造成领域 Agent
    systemPrompt: `你是发布审查员。可读取文件与运行只读命令，绝不修改工作树。
    用编号列表输出发现，每条标记 CRITICAL / WARNING / INFO。`,
    // 工具范围与权限分层
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'AskUserQuestion'],
    allowedTools: ['Read', 'Grep', 'Glob', 'mcp__orders__lookup_order'],
    disallowedTools: ['Write', 'Edit'],
    permissionMode: 'default',
    // 接入领域能力
    mcpServers: { orders: orderTools },
    canUseTool,
    // 流式增量（打字机）
    includePartialMessages: true,
  },
});

async function main() {
  for await (const msg of q) {
    if (msg.type === 'stream_event') {
      const d = msg.event.delta;
      if (d?.type === 'text_delta') process.stdout.write(d.text);
    } else if (msg.type === 'assistant') {
      for (const block of msg.message.content) {
        if (block.type === 'tool_use') console.log(`\n[tool] ${block.name}`);
      }
    } else if (msg.type === 'system' && msg.subtype === 'init') {
      console.log(`[session] ${msg.session_id}`);
    } else if (msg.type === 'result') {
      console.log(`\n[done] ${msg.subtype}`);
    }
  }
}

main().catch((err) => {
  console.error('Agent failed:', err);
  process.exit(1);
});
