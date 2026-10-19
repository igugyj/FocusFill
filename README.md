# FocusFill

Firefox 扩展：点击输入框，在输入框右侧出现一个小圆点，点击或按 `Ctrl+Enter` 填入本地保存的个人信息。规则完全本地编辑，不联网，不上传

---

## 功能

- **聚焦即提示**：点击可填写的输入框，命中规则且值不为空时，输入框右侧内部出现一个小圆点。
- **两种填充方式**：点击小圆点，或按 `Ctrl+Enter`。
- **撤销填充**：按 `Alt+Z` 撤销最近一次填充，只撤销未被手动修改的字段。
- **多级字段匹配**：`autocomplete` → `name/id/data-name` → `label[for]` → 就近容器文本 → `placeholder/aria-label` → `type`。
- **规则完全本地**：在设置页直接编辑 JSON，保存后立即生效，无需刷新页面。
- **本地存储**：数据保存在 `browser.storage.local`，网页脚本无法读取。
- **深色模式**：提示浮层和设置页跟随系统深色/浅色。
- **无网络请求**：没有服务器、账号、分析、追踪。

---

## 安装（开发）

需要 Node.js 22+。

```bash
git clone https://github.com/igugyj/FocusFill.git
cd FocusFill
npm install
npm run dev:firefox
```

`npm run dev:firefox` 会编译 TypeScript、生成 manifest、启动一个临时 Firefox 配置并加载扩展。

---

## 构建

```bash
npm run build:firefox    # 输出到 .output/firefox-mv3/
npm run zip              # 生成 .output/*-firefox.zip，用于 AMO 提交
```

---

## 使用

1. 点击 Firefox 工具栏的 FocusFill 图标，打开设置页。
2. 编辑 JSON 规则，把每个字段的 `value` 改成你自己的信息。
3. 点击“保存”。
4. 打开任意 `http://` 或 `https://` 网页，点击输入框。
5. 命中规则且值不为空时，输入框右侧出现小圆点。
6. 点击小圆点，或按 `Ctrl+Enter` 填充。
7. 填错了按 `Alt+Z` 撤销。

---

## 规则格式

设置页里编辑的是一个 JSON 数组，每一项是一个字段规则：

```json
[
  {
    "key": "name",
    "label": "姓名",
    "keywords": ["姓名", "真实姓名", "名字", "full name", "your name"],
    "aliases": ["name", "fullname", "realname", "yourname"],
    "value": "张三"
  },
  {
    "key": "email",
    "label": "邮箱",
    "keywords": ["电子邮箱", "邮箱", "电子邮件", "email", "e-mail", "mail"],
    "aliases": ["email", "mail", "emailaddress"],
    "value": "zhangsan@example.com"
  }
]
```

| 字段       | 说明                                           |
| ---------- | ---------------------------------------------- |
| `key`      | 唯一标识，同一份规则里不能重复                 |
| `label`    | 显示在小圆点 `title` 上的名字                  |
| `keywords` | 文本关键词数组，匹配页面上靠近输入框的文字     |
| `aliases`  | 属性别名数组，匹配 `name` / `id` / `data-name` |
| `value`    | 要填入的值，留空则该字段不提示                 |

### 匹配顺序

1. `autocomplete` 标准属性（`email`、`tel`、`given-name`、`organization` 等）
2. `name` / `id` / `data-name` 与 `aliases` 精确匹配
3. `<label for>` 文本与 `keywords` 匹配
4. 输入框向上 6 层内、只含该输入框的容器文本与 `keywords` 匹配
5. `placeholder` / `aria-label` 与 `keywords` 匹配
6. `input[type=email]` / `input[type=tel]` 兜底

前面的层级命中即返回，不再往下走。

---

## 快捷键

| 键           | 功能               |
| ------------ | ------------------ |
| `Ctrl+Enter` | 填充当前提示的字段 |
| `Alt+Z`      | 撤销最近一次填充   |
| `Esc`        | 隐藏提示           |

设置页内 `Ctrl+S` / `Cmd+S` 保存规则。

---

## 测试页

固定测试表单托管在 GitHub Pages：

<https://igugyj.github.io/FocusFill/test.html>

页面覆盖 `name`、`autocomplete`、`label[for]`、`placeholder`、`select` 五类匹配场景，适合改完规则后快速回归。

扩展自身的 `moz-extension://` 页面和本地 `file://` 页面受浏览器限制，content script 无法注入，所以测试页放在 `https://` 下。

---

## 隐私

FocusFill 不收集、不传输、不分享任何用户数据。完整政策见 [PRIVACY.md](./PRIVACY.md)。

---

## 已知限制

- 不支持 iframe 内的表单（`allFrames: false`）。
- 不支持 Shadow DOM 内部的输入框。
- 不支持 `contenteditable`。
- 浏览器内置页面、扩展商店、PDF 查看器、`moz-extension://`、`file://` 无法注入。
- 已有值的输入框默认不提示，避免覆盖手动填写的内容。

---

## 项目结构

```
FocusFill/
├── entrypoints/
│   ├── background.ts          # 工具栏点击 → 打开设置页
│   ├── content.ts             # focusin 监听、匹配、填充、撤销
│   └── settings/
│       ├── index.html         # 规则编辑页
│       └── main.ts
├── utils/
│   ├── types.ts
│   ├── defaults.ts
│   ├── storage.ts
│   ├── matcher.ts
│   ├── fill.ts
│   ├── highlight.ts
│   └── undo.ts
├── assets/
│   └── icon.png               # 源图，auto-icons 自动生成多尺寸
├── public/                    # 静态资源（不含测试页）
├── test.html                  # GitHub Pages 测试页
├── wxt.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 技术栈

- [WXT](https://wxt.dev/) 0.21
- TypeScript 5.9
- Vite 8
- Firefox MV3

---

## 许可证

MIT License，见 [LICENSE](./LICENSE)。

Copyright (c) 2026 Pfolg
