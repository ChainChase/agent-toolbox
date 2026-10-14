# 设计令牌（Design Tokens）

## 色板（HSL CSS 变量，写入 src/index.css :root）

```css
:root {
  --background: 48 24% 93%;      /* 暖米白纸底（取自用户参考图） */
  --foreground: 206 12% 15%;     /* 墨黑正文 */
  --card: 50 30% 97%;            /* 纸面卡片 */
  --primary: 206 12% 20%;        /* 石墨深墨（用户气泡/主按钮） */
  --primary-foreground: 50 30% 97%;
  --secondary: 48 18% 88%;       /* 沙色 */
  --muted: 48 16% 89%;
  --muted-foreground: 36 8% 40%;
  --accent: 18 68% 44%;          /* 赤陶橙（强调/激活/Toggle） */
  --accent-foreground: 48 30% 97%;
  --destructive: 6 55% 45%;      /* 砖红（输入框边框/危险操作） */
  --success: 158 24% 32%;        /* 苔绿（仅状态语义：已完成；控件禁用绿色） */
  --border: 46 14% 80%;          /* 暖发丝线 */
  --ring: 18 68% 44%;
  --terminal-bg: 198 8% 13%;     /* 深墨终端面板 */
  --terminal-fg: 45 14% 78%;
}
.dark {
  --background: 200 8% 11%; --foreground: 45 16% 88%; --card: 200 8% 14%;
  --primary: 45 20% 90%; --accent: 18 68% 52%; --border: 200 6% 24%;
  --terminal-bg: 198 8% 9%;
}
```

tailwind.config.ts 中 colors 一律 `hsl(var(--token))` 映射；禁止在 className 写裸色。

## 主题预设（浅色时覆写 CSS 变量）

| id | 名称 | bg | card | accent | ink |
|---|---|---|---|---|---|
| parchment | 羊皮纸（默认） | #f4ecdd | #faf5e9 | #a5642a | #2e2820 |
| forest | 森林 | #eceee9 | #f7f8f5 | #3f6b58 | #22262b |
| mint | 薄荷 | #e9f2ee | #f6faf8 | #2e8b74 | #1f2a26 |
| honey | 蜜蜂 | #f6efdd | #fbf7ec | #b07d1e | #2b2618 |

实现要点：`hexToHslTriplet()` 转 "H S% L%" 后 `root.style.setProperty`；切深色时 removeProperty 回退 .dark 令牌。Toggle/按钮/勾选跟随 accent（换主题即换色，默认主题为赤陶红）。

## 圆角体系（方圆结合，核心辨识度）

```
rounded-sm  = 2px   面板、按钮、输入框切角（方）
rounded-card = 6px  卡片容器
rounded-bubble = 14px  气泡/浮层（圆），但必须配一个切角：
  .bubble-user  { @apply rounded-bubble rounded-br-sm; }  用户气泡右下切直
  .bubble-agent { @apply rounded-bubble rounded-bl-sm; }
rounded-chip = 999px  状态 chip、Toggle 滑块
```

## 字体

```ts
fontFamily: {
  sans: ['"Inter"', '"Noto Sans SC"', '"HarmonyOS Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
  mono: ['"JetBrains Mono"', '"Cascadia Mono"', 'Consolas', 'monospace'],
}
```
衬线开关：`document.body.style.fontFamily = 'Georgia, "Noto Serif SC", SimSun, serif'`。

## 阴影

```
shadow-paper: 0 1px 2px hsl(30 12% 18% / 0.05)
shadow-float: 0 8px 24px -12px hsl(30 12% 18% / 0.18)
```

## 布局尺寸

| 元素 | 尺寸 |
|---|---|
| 左侧项目栏 | 288px（收起 0px，transition-[width] duration-300 ease-[cubic-bezier(.2,0,0,1)] 平推） |
| 右侧终端 | 420px（同上动画；<1100px 视口自动收起） |
| 聊天列宽 | 640 / 880 / 1040（紧凑/标准/宽松，style.maxWidth 切换） |
| 输入框 | rounded-xl 四角圆角、destructive 边框、min-h 38px + 底部大留白让虚线下移贴底行 |
| 弹窗 | w-[440px] rounded-xl；进出场 180~200ms（opacity + translate-y） |

## 工具类

```css
.no-scrollbar { scrollbar-width: none; }        /* 隐藏原生滚动条 */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-glass .backdrop-blur { backdrop-filter: none !important; }  /* 玻璃开关 */
```

## 图像资产

需要插画/logo 时用 ImageGen 生成，提示词必须锁定色板（例：`warm cream background #f5f4ef, ink charcoal lines, terracotta #c4551f single accent, flat vector`）。空态插画 1024x1024、logo 1024x1024，存 `ui/public/`。用户头像用真实照片，`rounded-full object-cover`。
