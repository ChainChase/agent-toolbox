# 设置页规范（Settings Patterns）

## 结构

- **全屏覆盖层**（fixed inset-0 z-50），不是路由跳转；左侧 236px 导航（分组 + hash 导航 + 搜索框），右侧主区。
- 进入：translate-y-0 opacity-100；退出：先播 180~200ms 渐隐+下移再卸载（内部 mounted/closing 双状态，禁直接条件渲染）。
- hash 导航必须监听 `hashchange` 事件触发重渲染（只改 location.hash React 不会重渲染）。

## 内容红线

1. **按当前项目真实情况重组，严禁照搬其他产品的设置项**。参考图只是版式示意。写每一项前先问：这个功能在本项目真实存在吗？数据哪来的？
2. **禁占位**。保留的每个开关/下拉/输入都必须真实接线到应用状态（点击立刻改变界面行为）。
3. 破坏性操作（删除模型/删除记忆）弹窗确认。
4. Toggle/主按钮/启用勾选用主题 accent 色，**不用绿色**（绿色仅留给"已完成"状态语义）。

## React 受控组件陷阱（实测踩过）

1. **下拉 value 与选项标签不一致**：state 用英文键（standard/sans）而 option 是中文标签 → select 永远显示第一项且不生效。必须加映射层：`WIDTH_LABEL[state]` 显示、`WIDTH_BY_LABEL[label]` 回写。
2. **ElementHandle.select() 不触发 React onChange**（puppeteer 实测）：自动化验证时用原生 setter 三连：
   ```js
   const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
   setter.call(sel, value);
   sel.dispatchEvent(new Event('input', { bubbles: true }));
   sel.dispatchEvent(new Event('change', { bubbles: true }));
   ```
3. 全屏覆盖层后面还挂着主界面，**选择器必须加 `.fixed.inset-0` 作用域**，否则会选中底层页面的同类元素（如聊天页悬浮导航条的圆点也是 `rounded-full` 按钮，曾导致点错控件）。

## 常见设置项真实接线范例

| 设置项 | 真实效果 |
|---|---|
| 主题四卡 + 浅色/深色 | hexToHslTriplet 转 HSL 后覆写 :root CSS 变量；深色用 .dark 令牌 |
| 内容宽度 | 消息列与输入框 style.maxWidth 640/880/1040 |
| 字体风格 | document.body.style.fontFamily 切换衬线/无衬线 |
| 模糊与玻璃效果 | 根节点 toggle `no-glass` 类，CSS 禁用 backdrop-blur |
| 终端主题 | xterm `term.options.theme` 实时切换亮/暗配色 |
| 流式动画 | 关闭后 StreamedText 全部直显（历史消息本就不重播） |
