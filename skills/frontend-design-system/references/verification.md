# 无头验证流程（Verification）

用户偏好**少开真窗**，一律用本地无头 Edge 截图 + DOM 断言，不用真实浏览器窗口。

## 标准动作

```bash
npm run build          # 1. 构建必须通过
node scripts/shot.mjs  # 2. 无头截图到 .shots/
node scripts/verify-xxx.mjs  # 3. 交互断言（按需写）
```

## 截图脚本用法

拷贝 skill 的 `scripts/shot.mjs` 到项目 `scripts/`，改三处：URL、输出文件名、需要的前置交互（点击/选择）。运行后**必须 Read 截图**确认视觉效果，再向用户汇报。

## 交互断言脚本要点

- 复用 dev server（先 `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` 探活，挂了就后台重启）。
- React 受控输入/下拉用原生 setter + input/change 三连（见 settings-patterns.md）。
- 元素定位用 `document.evaluate` 按文本查找按钮：`[...document.querySelectorAll('button')].find(b => b.textContent.includes('...'))`。
- 弹窗内元素选择器加 `.fixed.inset-0 .rounded-xl` 作用域。
- 断言完 `console.log(JSON.stringify(out))` 收尾，逐项核对。

## 踩坑记录（都实际发生过）

1. **shell 吃反斜杠**：内联 `node -e "..."` 里的 Windows 路径 `C:\\Program Files\\...` 被 Git Bash 转义破坏 → 一律用 Write 工具写脚本文件再执行。
2. **.mjs 不能写 TS 类型标注**：`async function f(x: string)` 直接语法错误。
3. **puppeteer 选择器语法**：`'sel >> nth=2'` 不能拼接在别的选择器后面；用 `page.$$('sel')` 再取下标。
4. **验证脚本自身先于应用被怀疑**：断言失败时先检查选择器/时序/作用域是否选错元素，再怀疑应用代码——本次多个"bug"最终都是脚本问题（选错按钮、select 不触发 onChange、索引偏移把搜索框当输入框）。
5. **截图被 in-app Browser 拦截**（NATIVE_BROWSER_VIEWPORT_UNAVAILABLE）时不要纠缠，切换无头 Edge 方案。
6. **背景页面污染**：设置覆盖层后面的聊天页有同类 class 元素（导航圆点=rounded-full 按钮），作用域选择器是刚需。

## 验收标准（三者全绿才算完成）

1. `npm run build` 零 error。
2. 截图视觉符合设计令牌（色板/圆角/对齐）。
3. 交互断言全部 true（含对抗场景：该拦的拦、该确认的确认、该生效的生效）。
