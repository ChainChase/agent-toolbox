# Agent Toolbox

A curated collection of **agent skills, plugins, and MCP (Model Context Protocol) configurations** for AI coding agents.

中文 | [English](README_EN.md)

## Structure

```
├── skills/     # Standalone agent skills
├── plugin/     # Full agent plugins (each with multiple skills)
└── MCP/        # MCP server configurations (mcp.json)
```

## Contents

### `plugin/` — Agent Plugins

| Plugin | Description |
|--------|-------------|
| `browser` | Browser automation & web interaction skills |
| `chrome` | Chrome browser control |
| `cannbot-skills` | Ascend C / NPU operator development skills (AscendC, Triton, TileLang, CATLASS, profiling, debugging, precision, sync audit, etc.) |
| `codex-obsidian` | Obsidian CLI workflows |
| `computer-use` | Computer use / GUI automation |
| `data-processing` | Data processing workflows |
| `deep-research-assistant` | Deep research assistant |
| `frontend-design` | Frontend design system skills |
| `github` | GitHub integration (MCP + app config) |
| `html-report-presentation` | HTML report / deck generation |
| `jingmei-ppt` | PPT generation |
| `lark` | Feishu/Lark suite (IM, docs, base, slides, mail, OKR, approval, wiki, drive, task, meeting…) |
| `office-plugin` | Office document skills (docx, pptx, xlsx) |
| `prd-authoring` | PRD authoring |
| `rapid-prototype-craft` | Rapid prototyping |
| `research-data-analysis-workspace` | Research data analysis workspace |
| `visual-image-generator` | Visual image generation |
| `web-app-development` | Web app development |
| `whiteboard` | Whiteboard design (canvas editor) |

### `skills/` — Standalone Skills

`docx-cn`, `excel`, `frontend-design-system`, `model-api-reference`, `pdf-intelligence-suite`, `qoder-agent-sdk-skill`, `self-improvement`, `ui-designer`

## Usage

Each skill follows the standard agent skill layout (`SKILL.md` + `references/` + `scripts/`). Install by copying the desired plugin/skill folder into your agent's skills directory (e.g. `~/.copilot/skills/` or `.github/skills/`).

### MCP Configuration

`MCP/mcp.json` is a standard MCP client config. **Secrets are not included** — credential values use `${ENV_VAR}` placeholders. Set the corresponding environment variables before use:

| Variable | Used by |
|----------|---------|
| `KAGGLE_KEY` | Kaggle MCP server |
| `ATOMGIT_TOKEN` | Atomgit MCP server |
| `GITHUB_PAT_TOKEN` | GitHub MCP server (`plugin/github/.mcp.json`) |

## Notes

- No real secrets are stored in this repo — all credentials use `${ENV_VAR}` placeholders;
- Executable paths in `MCP/mcp.json` are the author's local paths; adjust them to your own install locations;
- `plugin/lark/bin/lark-cli.exe` (~47MB Windows binary) is not tracked in git — download it from the Feishu/Lark open platform and place it in that directory;
- The `references/` docs inside each skill are reference materials for that skill.

## License

MIT, see [LICENSE](LICENSE). Personal collection for agent tooling reference.
