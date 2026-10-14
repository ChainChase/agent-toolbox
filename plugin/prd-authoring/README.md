# PRD Authoring

面向产品需求撰写与补全的 TRAE Skills-only 插件。

## 能力范围

- 将零散想法、会议记录、调研材料或既有草稿整理为完整 PRD
- 根据需求规模与风险裁剪文档深度
- 定义用户、核心任务、触发条件、完成状态、业务对象和 P0 范围
- 补全功能规则、字段、状态、权限、异常和恢复路径
- 输出常规章节式 PRD
- 输出以可点击原型为主体、与需求文本联动的交互式 PRD
- 检查事实标注、范围、规则深度和跨模块一致性

## 不负责

- 技术架构、API、数据库和代码实现方案
- 独立的市场、竞品或用户研究
- 只有视觉稿、没有需求文档的原型设计
- 营销文案、报告、教程和其他通用写作
- 未明确要求的排期、人员配置和运营计划

## 默认行为

- 泛化的“写 PRD”请求生成常规章节式 PRD
- 明确要求交互式、原型优先、左右分屏或原型与需求联动时生成交互式 PRD
- 未指定格式时输出自包含 HTML
- 明确指定 Markdown、DOCX 或 PDF 时遵循用户格式
- 缺失但不阻塞主流程的信息使用 `[TBD]` 或 `[Assumption, TBD]` 标记

## 目录

```text
prd-authoring/
├── .trae-plugin/plugin.json
├── assets/icon.svg
├── skills/prd-authoring/
│   ├── SKILL.md
│   └── references/
│       ├── conventional-prd.md
│       └── interactive-prd.md
└── README.md
```

插件不包含 MCP、外部服务或运行时依赖。
