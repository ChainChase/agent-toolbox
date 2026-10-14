# Agent 工具箱（Agent Toolbox）

精选的**智能体技能（Skills）、插件（Plugins）与 MCP（Model Context Protocol）配置**合集，适用于各类 AI 编程智能体。

[English](README_EN.md) | 中文

## 目录结构

```
├── skills/     # 独立智能体技能
├── plugin/     # 完整智能体插件（每个包含多个技能）
└── MCP/        # MCP 服务器配置（mcp.json）
```

## 内容清单

### `plugin/` — 智能体插件

| 插件 | 说明 |
|--------|-------------|
| `browser` | 浏览器自动化与网页交互 |
| `chrome` | Chrome 浏览器控制 |
| `cannbot-skills` | 昇腾 Ascend C / NPU 算子开发技能集（AscendC、Triton、TileLang、CATLASS、性能分析、调试、精度、同步检视等） |
| `codex-obsidian` | Obsidian CLI 工作流 |
| `computer-use` | 计算机使用 / GUI 自动化 |
| `data-processing` | 数据处理工作流 |
| `deep-research-assistant` | 深度研究助手 |
| `frontend-design` | 前端设计系统技能 |
| `github` | GitHub 集成（MCP + App 配置） |
| `html-report-presentation` | HTML 报告 / 演示文稿生成 |
| `jingmei-ppt` | PPT 生成 |
| `lark` | 飞书套件（IM、文档、多维表格、幻灯片、邮件、OKR、审批、知识库、云盘、任务、会议等） |
| `office-plugin` | Office 文档技能（docx、pptx、xlsx） |
| `prd-authoring` | PRD 编写 |
| `rapid-prototype-craft` | 快速原型制作 |
| `research-data-analysis-workspace` | 研究数据分析工作区 |
| `visual-image-generator` | 视觉图像生成 |
| `web-app-development` | Web 应用开发 |
| `whiteboard` | 白板设计（canvas 编辑器） |

### `skills/` — 独立技能

`docx-cn`、`excel`、`frontend-design-system`、`model-api-reference`、`pdf-intelligence-suite`、`qoder-agent-sdk-skill`、`self-improvement`、`ui-designer`

## 使用方法

每个技能遵循标准智能体技能结构（`SKILL.md` + `references/` + `scripts/`）。将所需的插件/技能目录复制到智能体的技能目录（如 `~/.copilot/skills/` 或 `.github/skills/`）即可使用。

### MCP 配置

`MCP/mcp.json` 是标准 MCP 客户端配置。**仓库内不含任何个人敏感信息**——所有 MCP 配置的密钥、账号、本机路径均已替换为 `${环境变量}` 占位符，使用前请设置对应的环境变量：

| 环境变量 | 用途 |
|----------|---------|
| `KAGGLE_KEY` / `KAGGLE_USERNAME` | Kaggle MCP 服务器 |
| `ATOMGIT_TOKEN` | Atomgit MCP 服务器 |
| `FIGMA_API_KEY` | Figma MCP 服务器（Framelink） |
| `HUAWEICLOUD_MCP_SERVER_PATH` / `HCLOUD_BIN` | 华为云 MCP 服务器 |
| `GITHUB_PAT_TOKEN` | GitHub MCP 服务器（`plugin/github/.mcp.json`） |
| `GITHUB_APP_CONNECTOR_ID` | GitHub App 连接 ID（`plugin/github/.app.json`） |

## 注意事项

- 仓库内**不含任何个人敏感信息**：所有 MCP 配置的密钥、账号、本机路径均已替换为 `${环境变量}` 占位符，使用时按需设置；
- `plugin/lark/bin/lark-cli.exe`（约 47MB 的 Windows 可执行文件）未纳入版本库，需从飞书开放平台单独获取后放入该目录；
- 各技能内的 `references/` 文档为对应技能的参考资料，可按需查阅。

## License

MIT，详见 [LICENSE](LICENSE)。个人智能体工具合集，仅供参考。
