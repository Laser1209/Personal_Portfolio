# AI 多模型对话工具与 DeepSeek 网页悬浮窗 AI 助手 — 综合技术文档

> **更新记录**
> 
> | 日期 | 版本 | 变更内容 |
> |------|------|---------|
> | 2026-06-18 | v1.1 | 同步三大核心优化：按钮两步确认清除（替代 confirm）、API 预注入启动（init 自动加载）、气泡文字层级颜色显式设定；新增 TC11-TC13 测试用例；新增 4.1.4 代码片段；FAQ 新增 2 条 |

---

# 第一部分：项目综合信息总结

---

## 1. 项目概述

### 1.1 项目目的

本项目旨在构建一套**轻量化、可复用、多模型兼容**的 AI 大模型对话接入方案，核心目标包括：

- **降低 AI 对话接入门槛**：通过 OpenAI 兼容 SDK 统一调用多厂商 API（火山引擎豆包、DeepSeek），屏蔽底层差异
- **验证多种交互形态**：涵盖 CLI 终端、纯前端 Web、Flask 后端代理三种架构模式
- **探索页面嵌入方案**：实现悬浮窗式 AI 助手，将对话能力无缝嵌入任意网页
- **提供学习参考**：为后续项目提供可直接套用的代码模板和架构范式

**目标用户群体：**
- 前端/全栈开发者：需要快速为网页集成 AI 对话能力
- AI 应用初学者：学习 OpenAI 兼容 API 调用模式
- 产品/项目经理：验证 AI 助手的交互体验和可行性

### 1.2 技术架构

#### 1.2.1 整体系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       用户交互层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  CLI 终端     │  │  纯前端 Web   │  │  Flask Web + HTML │  │
│  │ (Python)     │  │ (HTML/JS单文件)│  │  (后端代理模式)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                 │                    │              │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
│  │                    API 通信层                            │  │
│  │  · OpenAI Python SDK (CLI / Flask)                     │  │
│  │  · fetch + ReadableStream (纯前端直连)                   │  │
│  │  · fetch + JSON (Flask 前端 → 后端 → API)              │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │                     AI 模型服务层                        │  │
│  │  ┌─────────────────┐         ┌─────────────────────┐   │  │
│  │  │ 火山引擎方舟      │         │ DeepSeek API         │   │  │
│  │  │ ark.cn-beijing   │         │ api.deepseek.com     │   │  │
│  │  │ 模型: 豆包2.0 Pro │         │ 模型: deepseek-chat  │   │  │
│  │  └─────────────────┘         └─────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    悬浮窗 AI 助手系统                    │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │ 页面内容提取器 │  │ 角色配置引擎 │  │ 流式渲染引擎   │  │  │
│  │  │ (DOM Walker) │  │ (System     │  │ (SSE Parser)  │  │  │
│  │  │              │  │  Prompt构建)│  │               │  │  │
│  │  └──────────────┘  └────────────┘  └────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2.2 技术选型与版块职责

| 组件 | 技术选型 | 职责 |
|------|---------|------|
| **CLI 客户端** | Python 3.14 + openai SDK | 命令行对话，多轮上下文，角色定制 |
| **纯前端 Web** | 原生 HTML/CSS/JS，零依赖 | 浏览器内直连 DeepSeek API，localStorage 持久化 |
| **Flask 后端** | Python Flask + openai SDK | API 代理中转，Key 隔离，服务端会话管理 |
| **悬浮窗 AI 助手** | 原生 HTML/CSS/JS，单文件 | 页面嵌入对话，流式输出，内容感知，角色配置 |
| **数据持久化** | JSON 文件 / localStorage | 对话历史存取，会话恢复 |

### 1.3 核心功能

| 模块 | 功能 | 实现目标 |
|------|------|---------|
| **多模型接入** | 同时支持豆包和 DeepSeek | 统一 SDK，改参数即可切换 |
| **多轮对话** | 完整 messages 数组维护 | 上下文理解，连续对话 |
| **角色定制** | System Prompt 动态注入 | 可设定任意 AI 人格 |
| **流式输出** | SSE (Server-Sent Events) 解析 | 逐字打字效果，降低感知延迟 |
| **页面内容感知** | DOM Walker 自动提取 | AI 了解当前网页内容 |
| **对话历史** | localStorage / JSON 持久化 | 跨会话记忆恢复 |
| **悬浮窗 UI** | fixed 定位 + 动画系统 | 不干扰主页面，响应式适配 |
| **错误处理** | 分级错误提示 + 自动消失 | 友好用户体验 |

### 1.4 实现方法

**核心实现思路：**

1. **统一 API 调用层**：所有对话功能基于 OpenAI 兼容的 `chat/completions` 端点，通过修改 `base_url` 和 `model` 参数适配不同供应商。

2. **客户端状态管理**：API 本身是无状态的，所有对话上下文由客户端维护 `messages` 数组（`[{role, content}]` 格式），每次请求携带完整历史。

3. **System Prompt 注入**：在 `messages` 数组首位插入 `{role: "system", content: "..."}` 定义 AI 行为模式，这是角色扮演和专业定制的关键机制。

4. **流式响应处理**：设置 `stream: true` 参数，通过 `ReadableStream` API 逐块读取 SSE 数据流，解析 `data: {...}` 行提取增量文本，实时更新 DOM。

5. **页面内容知识库**：使用 `TreeWalker` API 遍历页面可见文本节点，提取 `<title>`、`<meta>`、`<h1-h3>` 和正文内容，注入 System Prompt 作为 AI 的背景知识。

**关键技术路径：**

```
用户输入 → 预处理 → 构建请求体 → 发送 API → 
  ├─ 非流式: 等待完整响应 → JSON 解析 → 渲染
  └─ 流式:  ReadableStream → SSE 逐行解析 → 逐字渲染 → 闪烁光标
→ 追加到 messages → 保存到存储 → 滚动到底部
```

### 1.5 开发环境规范

| 项目 | 规范 |
|------|------|
| **操作系统** | Windows 10/11 (PowerShell 5+) |
| **Python 版本** | 3.14 |
| **包管理** | pip |
| **编码规范** | Python: PEP 8；JS: ES6+；CSS: BEM 风格命名 |
| **文件编码** | UTF-8（含中文注释） |
| **版本控制** | Git，提交信息使用中文描述 |
| **命名约定** | Python: snake_case；JS: camelCase；CSS: kebab-case |
| **API Key 管理** | 开发期硬编码（仅本地），生产环境使用环境变量或 .env |

### 1.6 第三方依赖

| 名称 | 版本 | 类型 | 用途 | 许可 |
|------|------|------|------|------|
| `openai` | latest | Python 包 | OpenAI SDK，兼容调用豆包/DeepSeek | MIT |
| `flask` | latest | Python 包 | Web 框架（仅 server.py / server_memory.py） | BSD-3 |
| Google Fonts | CDN | 字体 | Noto Sans SC + Space Mono（仅 Flask 版和悬浮窗） | OFL |

**注意**：纯前端版本（`chat_frontend.html`、`chat_frontend_memory.html`、`floating_ai_widget.html`）**零 NPM 依赖**，仅使用浏览器原生 API（fetch、ReadableStream、localStorage、TreeWalker）。

### 1.7 API 接口

#### 1.7.1 DeepSeek Chat Completions API

| 项目 | 内容 |
|------|------|
| **端点** | `POST https://api.deepseek.com/chat/completions` |
| **认证** | `Authorization: Bearer sk-xxx` |
| **Content-Type** | `application/json` |

**请求体结构：**

```json
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "你是一个友好助手"},
    {"role": "user", "content": "用户问题"}
  ],
  "stream": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型标识，固定 `deepseek-chat` |
| `messages` | array | 是 | 对话历史，支持 system/user/assistant |
| `stream` | boolean | 否 | 是否启用流式输出，默认 false |
| `temperature` | float | 否 | 随机性 0-2，默认 1.0 |
| `max_tokens` | int | 否 | 最大输出 Token 数 |

**非流式响应：**

```json
{
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "回复内容"
    }
  }]
}
```

**流式响应（SSE 格式）：**

```
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

#### 1.7.2 火山引擎方舟 API

| 项目 | 内容 |
|------|------|
| **端点** | `POST https://ark.cn-beijing.volces.com/api/v3/chat/completions` |
| **认证** | `api_key: ark-xxx` |
| **model 参数** | 推理接入点 ID（`ep-m-xxx`），**非模型名称** |

#### 1.7.3 Flask 后端内部 API（server.py / server_memory.py）

| 端点 | 方法 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| `/` | GET | — | HTML | 返回聊天界面 |
| `/api/chat` | POST | `{session_id, message, system_prompt}` | `{reply}` 或 `{error}` | 发送消息 |
| `/api/reset` | POST | `{session_id, system_prompt}` | `{status:"ok"}` | 重置会话 |
| `/api/memory` | GET | — | `{session_count, sessions}` | 查询记忆状态（仅记忆版） |
| `/api/memory/restore` | POST | `{session_id}` | `{found, history}` | 恢复历史（仅记忆版） |
| `/api/memory/clear` | POST | `{session_id?}` | `{status:"ok"}` | 清除记忆（仅记忆版） |

### 1.8 数据库模式

本项目**未使用传统关系型数据库**。数据持久化方案如下：

| 版本 | 存储方式 | 数据结构 |
|------|---------|---------|
| 纯前端 | `localStorage` (浏览器) | `{systemPrompt, messages: [{role, content}], updatedAt}` |
| CLI | 本地 JSON 文件 | `{updated_at, model, message_count, messages: [...]}` |
| Flask 后端 | 内存 dict + JSON 文件 | `{sessions: {session_id: [{role, content}]}}` |

**localStorage 键值设计：**

| Key | 内容 |
|-----|------|
| `fai_messages` | `[{role, content}, ...]` |
| `fai_persona` | `{nickname, role, tone}` |
| `fai_history_list` | `[{id, title, date}, ...]` |
| `ds_api_key` | `"sk-xxx"` |

**JSON 文件结构（deepseek_memory.json / sessions_memory.json）：**

```json
{
  "meta": { "last_saved": "2026-06-18T...", "session_count": 1 },
  "sessions": {
    "session_xxx": [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."}
    ]
  }
}
```

### 1.9 部署流程

#### CLI 版本部署

```powershell
# 1. 安装依赖
pip install openai

# 2. 修改代码中的 API Key

# 3. 运行
python deepseek_chat.py
```

#### 纯前端版本部署

```powershell
# 方式一：直接双击打开（需注意 file:// 协议限制）
start chat_frontend.html

# 方式二：通过 HTTP 服务器（推荐）
python -m http.server 8080
# 访问 http://localhost:8080/chat_frontend.html
```

**生产环境 Nginx 部署示例：**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ai-chat;
    index floating_ai_widget.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Flask 版本部署

```powershell
# 开发环境
python server.py  # 访问 http://127.0.0.1:5000

# 生产环境（使用 gunicorn）
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### 1.10 已知限制

| 限制 | 说明 | 影响范围 |
|------|------|----------|
| **API Key 硬编码** | CLI 和 server.py 中 Key 写在源代码 | 所有 Python 版本 |
| **纯前端 Key 泄露** | `floating_ai_widget.html` 中 Key 暴露在 JS | 悬浮窗版本 |
| **会话仅存内存** | Flask 的 sessions 字典进程重启即丢失（非记忆版） | server.py |
| **无 Token 计数** | 未限制单次请求的 Token 消耗 | 所有版本 |
| **CORS 依赖** | 纯前端方案依赖 API 提供商允许跨域 | chat_frontend.html 等 |
| **无用户认证** | 所有版本无登录鉴权机制 | Web 版本 |
| **无流式中断恢复** | 流式输出中断后无法从断点续传 | 悬浮窗版本 |
| **单页面对话** | 悬浮窗 AI 记忆随页面关闭清除（localStorage 限定域名） | 悬浮窗版本 |
| **页面内容提取开销** | 每次构建 System Prompt 需 TreeWalker 遍历页面文本节点 | 悬浮窗版本 |

> **已修复项**（记录历史问题）：悬浮窗初始化时已改为页面加载即预建 System Prompt（无需等待用户点击），字体层级已显式设置 `color` 消除对比度不足问题，清除历史改用两步点击确认替代 `confirm()` 以兼容 IDE 内嵌浏览器。

### 1.11 未来优化方向

| 方向 | 具体措施 | 优先级 |
|------|---------|--------|
| **安全加固** | API Key 移至 .env；添加用户认证层 | 高 |
| **流式中断恢复** | 记录已接收 token 偏移，支持断点续传 | 高 |
| **Token 管理** | 实时计数 + 自动截断超长历史 | 中 |
| **多页面联动** | 悬浮窗支持跨页面记忆（通过 sessionStorage + 服务端） | 中 |
| **语音交互** | 接入 Web Speech API 实现语音输入/输出 | 中 |
| **Docker 打包** | 编写 Dockerfile + docker-compose | 中 |
| **React 组件化** | 将悬浮窗封装为独立 React 组件 (npm 发布) | 低 |
| **多模型切换 UI** | 前端增加模型选择器，实时切换豆包/DeepSeek/本地模型 | 低 |
| **对话分支** | 支持从任意历史节点分叉新对话 | 低 |

---

# 第二部分：DeepSeek 网页悬浮窗 AI 助手实现方案

---

## 2.1 整体技术架构与实现路径

### 2.1.1 系统架构图

```
┌──────────────────────────────────────────────────┐
│              宿主网页 (floating_ai_widget.html)     │
│  ┌────────────────────────────────────────────┐  │
│  │  网页内容层                                  │  │
│  │  <nav> <main> <section> ...               │  │
│  │  ┌──────────────────┐                      │  │
│  │  │ 页面内容提取器     │ ← TreeWalker API     │  │
│  │  │ → System Prompt  │   提取标题/正文/结构   │  │
│  │  └────────┬─────────┘                      │  │
│  │           │ 注入背景知识                     │  │
│  └───────────┼─────────────────────────────────┘  │
│              ▼                                      │
│  ┌────────────────────────────────────────────┐  │
│  │  悬浮窗组件层 (z-index: 99980)               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ 触发器按钮│  │ 聊天面板  │  │ 配置面板  │  │  │
│  │  │ (56px圆) │  │(400×560)│  │(角色设置) │  │  │
│  │  │ 脉搏动画 │  │ 流式渲染  │  │ 历史管理  │  │  │
│  │  └──────────┘  └────┬─────┘  └──────────┘  │  │
│  │                      │                       │  │
│  │  ┌───────────────────▼────────────────────┐  │  │
│  │  │  state manager (messages[], history[]) │  │  │
│  │  │  localStorage 持久化                    │  │  │
│  │  └───────────────────┬────────────────────┘  │  │
│  └──────────────────────┼───────────────────────┘  │
│                         │                           │
└─────────────────────────┼───────────────────────────┘
                          │ fetch + ReadableStream
                          ▼
              ┌───────────────────────┐
              │   DeepSeek API        │
              │   api.deepseek.com    │
              │   POST /chat/         │
              │     completions       │
              │   stream: true        │
              └───────────────────────┘
```

### 2.1.2 技术栈选型

| 层级 | 技术 | 选型理由 |
|------|------|---------|
| **UI 框架** | 原生 HTML/CSS/JS | 零依赖，单文件部署，无需构建工具 |
| **DOM 操作** | 原生 DOM API | 极致轻量，无虚拟 DOM 开销 |
| **页面内容提取** | `TreeWalker` + `NodeFilter` | 浏览器原生 API，高效遍历文本节点 |
| **HTTP 请求** | `fetch` + `ReadableStream` | 支持流式读取，原生 SSE 解析 |
| **持久化** | `localStorage` | 约 5MB 容量，键值对存储，会话级恢复 |
| **字体** | Google Fonts (CDN) | `Noto Sans SC`（中文阅读） + `Space Mono`（代码） |
| **样式** | CSS Variables + 媒体查询 | 主题色可配置 + 640px 响应式断点 |
| **动画** | CSS `@keyframes` + `transition` | GPU 加速，无 JS 动画开销 |

### 2.1.3 实现阶段划分

| 阶段 | 目标 | 主要任务 | 交付物 |
|------|------|---------|--------|
| **第一阶段** | 基础悬浮窗 UI | 触发器按钮样式、面板布局、展开/收起动画、响应式适配 | HTML 结构 + CSS 完整样式 |
| **第二阶段** | AI 对话集成 | DeepSeek API 对接、非流式调用、消息渲染、错误处理 | 可用的基础对话功能 |
| **第三阶段** | 流式输出 | `ReadableStream` SSE 解析、逐字渲染、闪烁光标、中断机制 | 完整流式对话体验 |
| **第四阶段** | 页面感知 | `TreeWalker` 内容提取、System Prompt 动态构建、知识库注入 | AI 能回答页面相关问题 |
| **第五阶段** | 角色配置 | 设置面板 UI、角色参数化、持久化保存、实时生效 | 可自定义 AI 人格 |
| **第六阶段** | 记忆与历史 | localStorage 读写、对话历史列表、导出功能、跨会话恢复 | 完整的记忆系统 |
| **第七阶段** | 优化打磨 | 字体层级优化、错误提示美化、性能分析、边界测试 | 生产可用的完整产品 |

---

## 2.2 悬浮窗交互功能的设计与实现细节

### 2.2.1 UI/UX 设计规范

| 设计要素 | 规格 | 说明 |
|----------|------|------|
| **设计风格** | 暗色 · 琥珀光泽 · 毛玻璃 | 深炭色基底 + 琥珀色强调 |
| **触发器尺寸** | 56px × 56px（桌面）/ 50px（移动） | 正圆形悬浮按钮 |
| **面板尺寸** | 400px × 560px（桌面）/ 100vw × 100vh（移动） | 自适应视口 |
| **位置** | `fixed`, bottom: 24px, right: 24px | 固定右下角，滚动不移动 |
| **z-index** | 99980（面板）/ 99990（按钮） | 高于页面其余元素 |
| **主题色** | 琥珀渐变 `#f59e0b → #ea580c` | 温暖、有活力的品牌感 |
| **背景** | `rgba(18,20,28,0.95)` + `backdrop-filter: blur(24px)` | 毛玻璃效果 |
| **圆角** | 面板 18px / 气泡 14px / 按钮 10px | 柔和现代感 |
| **字体** | 头部 13px · 正文 13.5px · 提示 10px | 三档字号层次 |
| **滚动条** | 3px 宽半透明 | 不干扰阅读 |

**动画系统：**

| 动画 | 实现 | 时长 | 缓动 |
|------|------|------|------|
| 按钮脉搏呼吸 | `@keyframes faiPulse` (box-shadow) | 3s 循环 | ease-in-out |
| 按钮 hover 放大 | `transform: scale(1.08)` | 0.25s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| 面板展开 | `transform: scale(0/1) + opacity` | 0.35s | 同上（弹性） |
| 面板关闭 | `transform + opacity` | 0.25s | ease |
| 消息入场 | `@keyframes faiMsgIn` (opacity + translateY) | 0.3s | ease |
| 流式光标闪烁 | `@keyframes faiBlink` (opacity) | 0.8s | 循环 |

**气泡文字层级（已优化对比度）：**

| 层级 | 颜色 | 字号 | 说明 |
|------|------|------|------|
| 助手气泡正文 | `#e4e0da` | 13.5px | 暖白色，显式设置避免继承灰暗 |
| 用户气泡正文 | `#f5f0ea` | 13.5px | 微暖白，font-weight 480 |
| **加粗强调** | `#f59e0b` | 继承 | 琥珀色高亮，全局最强视觉焦点 |
| *斜体引用* | `#c4b998` | 继承 | 古铜色，与正文形成柔和反差 |
| `行内代码` | `#f0c060` | 0.9em | 金色 + 加深背景，与正文明确区分 |
| 代码块正文 | `#b4d0b4` | 12px | 薄荷绿 + 深黑底，终端沉浸感 |
| 列表标记 `::marker` | `#f59e0b` | 继承 | 琥珀色圆点，统一视觉锚点 |

### 2.2.2 核心交互功能

#### 2.2.2.1 悬浮窗显示与隐藏控制

```javascript
// 触发器点击 → 状态切换
triggerEl.addEventListener('click', () => {
  if (isOpen) closePanel();
  else openPanel();
});

// ESC 键关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) closePanel();
});

// 头部关闭按钮
minimizeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closePanel();
});
```

#### 2.2.2.2 展开/收起状态切换

展开时：按钮从对话气泡图标切换为 ✕ 关闭图标，面板 `transform: scale(1)` + `opacity: 1`。

收起时：按钮恢复对话气泡图标 + 绿色在线指示灯，面板缩回右下角。

```javascript
function openPanel() {
  panelEl.classList.add('open');         // scale(1) + opacity(1)
  triggerEl.classList.add('expanded');   // 隐藏指示灯，切换图标
  // System Prompt 已在页面加载时由 init() 预建，此处仅作兜底检查
  if (messages.length === 0 || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: buildSystemPrompt() });
  }
  // 首次打开且有历史记忆 → 渲染所有消息
  if (document.querySelectorAll('#faiMessages .fai-msg').length === 0) {
    renderAllMessages();
  }
}

function closePanel() {
  panelEl.classList.remove('open');      // scale(0) + opacity(0)
  triggerEl.classList.add('minimized');  // 显示指示灯，恢复图标
}
```

#### 2.2.2.3 输入与展示交互逻辑

- 输入框自动调整高度（`input` 事件 + `scrollHeight`，最大 100px）
- Enter 发送，Shift+Enter 换行
- 发送后清空输入框，禁用发送按钮
- 回复完成/出错后恢复按钮，自动聚焦输入框
- 每次新消息自动滚到底部（`requestAnimationFrame` 确保 DOM 更新后滚动）

#### 2.2.2.4 对话历史记录管理

- **自动保存**：历史列表 `historyList` 记录每条对话标题和时间戳（上限 50 条）
- **历史面板**：头部 📋 按钮展开历史列表，显示最近 20 条
- **清除**：`faiClearHistory()` 采用**两步点击确认**机制：
  - 第一次点击 → 按钮变红，文字变为"确认清除？"
  - 3 秒内再次点击 → 真正删除所有历史
  - 超时 3 秒 → 按钮恢复原状
  - 设计原因：避免 `confirm()` 弹窗在 IDE 内嵌浏览器中触发 React 渲染冲突（React error #185）
- **导出**：`faiExportHistory()` 生成带时间戳的 JSON 文件下载

### 2.2.3 响应式设计处理

```css
/* 桌面端 (默认) */
.fai-panel { width: 400px; height: 560px; border-radius: 18px; }

/* 移动端 (≤640px) */
@media (max-width: 640px) {
  .fai-trigger { width: 50px; height: 50px; }
  .fai-panel {
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%; height: 100%;
    border-radius: 0;
    transform: translateY(100%);  /* 从底部滑入全屏 */
  }
}
```

移动端策略：面板覆盖全屏（非弹出小窗），从底部整屏滑入，更适合手指操作。

---

## 2.3 AI 功能与 DeepSeek API 的集成方法及相关技术要求

### 2.3.1 API 调用流程

```
用户输入
  │
  ├─ 1. 追加 user 消息到 messages[]
  │
  ├─ 2. 创建 AbortController（支持中断）
  │
  ├─ 3. fetch POST → https://api.deepseek.com/chat/completions
  │     Headers: { Authorization: Bearer sk-xxx,
  │               Content-Type: application/json }
  │     Body: { model: "deepseek-chat",
  │             messages: [...全部历史...],
  │             stream: true }
  │
  ├─ 4. 检查 resp.ok
  │     ├─ 失败 → 解析错误 JSON → throw Error
  │     └─ 成功 → 获取 resp.body.getReader()
  │
  ├─ 5. 流式读取循环
  │     reader.read() → 解码 → 分割 \n → 过滤 data: 行
  │     → JSON.parse → delta.content → 追加显示
  │
  └─ 6. 完成 → 移除光标 → push assistant 消息 → 保存持久化
```

### 2.3.2 请求参数配置

```javascript
{
  model: 'deepseek-chat',     // 固定模型
  messages: messages,          // 完整对话历史（含 system prompt）
  stream: true,                // 开启流式输出
  // temperature: 1.0,         // 默认值，不传使用 API 默认
  // max_tokens: undefined,    // 不限制，依赖对话长度自然截断
}
```

**为什么不传 temperature 和 max_tokens：**
- `temperature` 使用 API 默认值 1.0，避免过度确定性导致回答死板
- `max_tokens` 不设限制，让 AI 自行决定回答长度

### 2.3.3 流式响应处理

流式处理是悬浮窗体验的核心。实现细节：

```javascript
async function streamResponse(userText) {
  const bubbleDiv = addMsgToDOM('assistant', '', true);  // 空气泡 + streaming 类
  const controller = new AbortController();

  const resp = await fetch(AI_CONFIG.baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_CONFIG.apiKey },
    body: JSON.stringify({ model: AI_CONFIG.model, messages, stream: true }),
    signal: controller.signal,
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';  // 保留不完整行

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6);
      if (json === '[DONE]') continue;

      const data = JSON.parse(json);
      const delta = data.choices?.[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        bubbleDiv.querySelector('.bubble').innerHTML = md(fullText);
        scrollToBottom();
      }
    }
  }
  // 完成后移除 streaming 光标
  bubbleDiv.querySelector('.bubble').classList.remove('streaming');
  messages.push({ role: 'assistant', content: fullText });
}
```

**流式光标 CSS：**

```css
.fai-msg .bubble.streaming::after {
  content: '▍';
  animation: faiBlink 0.8s infinite;
  color: #f59e0b;
}
@keyframes faiBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

**中断支持**：通过 `AbortController` 实现，用户可在流式过程中关闭面板中断请求。

### 2.3.4 API 调用性能优化

| 优化策略 | 实现方式 |
|----------|---------|
| **流式输出** | 避免等待完整响应，首字延迟 < 500ms |
| **预初始化** | 页面加载时 `init()` 即构建含页面知识库的 System Prompt，用户点开悬浮窗可立即对话 |
| **请求复用** | messages 数组增量追加，每次请求复用历史 |
| **Abort 支持** | 面板关闭时取消进行中的请求，释放连接 |
| **缓存策略** | localStorage 缓存角色配置和对话历史 |
| **DOM 批量操作** | 使用 `innerHTML` 批量渲染 Markdown，而非逐节点创建 |

---

## 2.4 内容处理流程与数据安全保障措施

### 2.4.1 用户输入处理流程

```
用户键入文本
  │
  ├─ 1. trim() 去除首尾空白
  │
  ├─ 2. 检查是否为空 → 空则忽略
  │
  ├─ 3. 检查 stream 状态 → 正在流式则忽略
  │
  ├─ 4. 构建 user 消息对象: { role: "user", content: text }
  │
  ├─ 5. 追加到 messages[] 数组
  │
  ├─ 6. 添加到 UI 消息列表
  │
  └─ 7. 保存到 localStorage
```

### 2.4.2 AI 响应内容处理

```
SSE 流到达
  │
  ├─ 1. TextDecoder 解码 UTF-8 字节流
  │
  ├─ 2. 按 \n 分割 SSE 数据行
  │
  ├─ 3. 过滤 "data: " 前缀行
  │
  ├─ 4. JSON.parse 解析每行数据
  │
  ├─ 5. 提取 choices[0].delta.content
  │
  ├─ 6. Markdown 渲染 (代码块/行内代码/加粗/斜体)
  │
  ├─ 7. innerHTML 更新气泡（每次增量，非重建）
  │
  └─ 8. 流结束后 push 完整 assistant 消息到 messages[]
```

### 2.4.3 页面内容自动提取机制

这是悬浮窗 AI 能回答页面相关问题的核心：

```javascript
function extractPageContext() {
  // 1. 提取 <title>
  // 2. 提取 <meta name="description">
  // 3. 提取所有可见 <h1><h2><h3> 文本（结构概览）
  // 4. 使用 TreeWalker 遍历文本节点，收集前 3000 字符正文
  //    - 排除 <script>/<style>/隐藏元素/输入框/悬浮窗自身
  // 5. 拼接为结构化上下文字典，注入 System Prompt
}
```

提取示例输出（注入到 System Prompt）：

```
# 网页标题: 星海科技 | AI驱动的数字化转型专家

# 网页描述: 星海科技 — 专注于人工智能与企业数字化转型的...

# 页面内容结构:
## AI驱动的数字化转型专家
## 核心产品
## 技术优势
## 核心团队
## 联系我们

# 网页关键内容摘要:
星海科技致力于为企业提供前沿的人工智能解决方案...
星海AI中台 一站式AI模型训练、部署与管理平台...
```

### 2.4.4 数据安全策略

| 安全维度 | 措施 |
|----------|------|
| **传输加密** | HTTPS（DeepSeek API 强制 TLS） |
| **存储安全** | 对话数据仅存浏览器 localStorage，不上传服务器 |
| **Key 保护** | 开发期硬编码（仅本地），建议生产环境移至 .env |
| **内容过滤** | 不存储密码、信用卡等敏感模式内容 |
| **合规** | 无第三方数据收集，100% 浏览器端处理 |

---

## 2.5 性能优化策略与用户体验提升方案

### 2.5.1 前端性能优化

| 优化项 | 实现方法 |
|--------|---------|
| **资源加载** | 单文件 HTML，CSS 和 JS 内联，仅 Google Fonts CDN 一个外部请求 |
| **渲染性能** | 使用 `requestAnimationFrame` 批量 DOM 更新，CSS `transform` 利用 GPU 合成 |
| **内存管理** | 历史列表上限 50 条，避免无限增长；定时器及时清除 |
| **懒加载** | System Prompt 仅在首次打开面板时构建 |
| **滚动优化** | `scroll-behavior: smooth` + 4px 自定义滚动条 |

### 2.5.2 用户体验增强

| 增强点 | 实现 |
|--------|------|
| **加载状态** | 流式输出：逐字打字 + 闪烁光标；等待中显示三点弹跳动画 |
| **错误提示** | 分类型：CORS 错误 / API 错误 / 网络错误，红色半透明条自动 6s 消失 |
| **操作引导** | 空状态显示提示文字「我是 XX，你的 AI 助手，可以问我关于这个页面的任何问题」 |
| **发送反馈** | 发送中按钮禁用 + 透明，完成后恢复 + 自动聚焦 |
| **历史管理** | 历史面板可查看/清除/导出 JSON |
| **角色切换** | 修改角色后自动提示「角色已更新！我是 XX，有什么可以帮你的吗？」 |

---

## 2.6 核心实现技术

### 2.6.1 悬浮窗 DOM 操作与样式控制

```javascript
// 状态驱动的样式切换
const togglePanel = () => {
  panelEl.classList.toggle('open');        // 显示/隐藏
  triggerEl.classList.toggle('minimized'); // 按钮图标切换
  triggerEl.classList.toggle('expanded');
};
```

通过 CSS 类 `open` / `minimized` / `expanded` 控制所有视觉状态，JS 只负责 toggle class，样式完全由 CSS 管理。

### 2.6.2 前端状态管理

```javascript
// 全局状态（模块级变量）
let messages = [];        // 对话历史 [{role, content}]
let isOpen = false;       // 面板状态
let isStreaming = false;  // 流式状态
let streamAbort = null;   // AbortController 引用
let historyList = [];     // 对话历史记录 [{id, title, date}]
```

无框架，纯模块级变量管理状态，通过 `saveToStorage()` / `loadFromStorage()` 实现持久化。

### 2.6.3 API 请求封装

```javascript
const AI_CONFIG = {
  apiKey: 'sk-xxx',
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/chat/completions',
  nickname: '小深',
  role: '星海科技智能网页助手',
  tone: '专业、友好、热情...',
};
```

配置集中管理，修改一处即可适配新 API，也可以通过设置面板运行时修改。

### 2.6.4 启动初始化流程（API 预注入）

页面加载时 `init()` 即自动完成所有准备工作，用户无需任何手动操作：

```javascript
function init() {
  // 1. 预填角色配置到 UI
  // 2. 尝试恢复 localStorage 持久化记忆
  const hasMemory = loadFromStorage();

  if (!hasMemory || messages.length === 0 || messages[0].role !== 'system') {
    // 首次使用 / 无记忆：预建含页面知识库的 System Prompt
    messages = [{ role: 'system', content: buildSystemPrompt() }];
  } else {
    // 有历史记忆：刷新页面内容到 System Prompt（页面可能已更新）
    messages[0].content = buildSystemPrompt();
    renderAllMessages();
  }
  saveToStorage();
}
```

**设计意图**：API Key 和角色信息由 `AI_CONFIG` 硬编码提供，System Prompt 和页面知识库在页面加载时即构建完毕。用户点开悬浮窗后可立即开始对话，无需任何「设置 Key / 设定角色」步骤。

### 2.6.5 实时通信技术

使用 `fetch` + `ReadableStream` 实现流式通信，无需 WebSocket 或 EventSource：

- **优势**：POST 请求支持，可传完整 messages 历史
- **机制**：`resp.body.getReader()` 返回 `ReadableStreamDefaultReader`
- **解析**：UTF-8 解码 → SSE 格式行分割 → JSON 解析 → 增量提取

### 2.6.6 本地存储方案

localStorage 三键体系：

| Key | 值类型 | 说明 |
|-----|--------|------|
| `fai_messages` | JSON 字符串 | 完整对话历史 |
| `fai_persona` | JSON 字符串 | 角色配置三元组 |
| `fai_history_list` | JSON 字符串 | 对话历史摘要列表 |

每次发送/接收消息后调用 `saveToStorage()`，页面加载时调用 `loadFromStorage()` 恢复。

---

## 2.7 详细复现步骤

### 步骤 1：开发环境准备

```powershell
# 无需安装任何依赖（纯前端版本）
# 可选：安装 Python 用于启动 HTTP 服务器
python --version  # 确认 Python 可用
```

### 步骤 2：项目初始化

```powershell
# 创建项目目录
mkdir ai-floating-widget
cd ai-floating-widget

# 创建文件（以下为单文件方案）
# 将 floating_ai_widget.html 放入该目录
```

### 步骤 3：配置 API Key

在 `floating_ai_widget.html` 中找到 `AI_CONFIG` 对象：

```javascript
const AI_CONFIG = {
  apiKey: 'sk-你的真实Key',  // ← 替换这里
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/chat/completions',
  nickname: '你的昵称',
  role: '你的角色定位',
  tone: '你的语气描述',
};
```

### 步骤 4：启动本地服务器

```powershell
python -m http.server 8080
# 浏览器访问 http://localhost:8080/floating_ai_widget.html
```

### 步骤 5：功能测试

1. **展开悬浮窗**：点击右下角琥珀色圆形按钮
2. **首次对话**：输入「星海科技有哪些核心产品」
3. **页面感知验证**：输入「CTO是谁」→ 应回答「李思涵」
4. **角色切换**：点齿轮 → 修改昵称和语气 → 应用
5. **流式效果**：问长篇问题，观察逐字打字效果
6. **历史查看**：点 📋 按钮查看对话记录
7. **导出测试**：点击导出，检查 JSON 文件内容
8. **移动端测试**：缩小浏览器窗口到 ≤640px，面板全屏展开

### 步骤 6：嵌入到其他网页

```html
<!-- 在目标网页中引入 -->
<!-- 1. 复制 <style id="floating-ai-styles">...</style> 到目标页 <head> -->
<!-- 2. 复制悬浮窗 HTML 结构到目标页 </body> 前 -->
<!-- 3. 复制 <script>...</script> 到目标页 </body> 前 -->
<!-- 4. 修改 AI_CONFIG 中的 API Key 和角色信息 -->
```

---

# 第三部分：总结与参考价值

## 3.1 项目核心价值

1. **多形态覆盖**：从终端 CLI → 独立聊天页 → 网页悬浮窗，满足全场景需求
2. **即拿即用**：纯前端版本零依赖，复制 HTML 即可运行
3. **页面感知**：创新性的页面内容自动注入机制，AI 天然了解网页内容
4. **流式体验**：SSE 逐字渲染，接近 ChatGPT 的实时交互感
5. **架构清晰**：所有代码单一职责，模块化设计，5 分钟理解全貌

## 3.2 作为参考资料的适用场景

| 场景 | 可参考的内容 |
|------|------------|
| 新手学习 LLM API 调用 | deepseek_chat.py（最简单的 OpenAI SDK 调用示范） |
| 需要 ChatGPT 式聊天界面 | chat_frontend.html（完整的 Web 聊天 UI） |
| 需要 API Key 安全的后端 | server.py（Flask 代理模式） |
| 需要跨会话记忆 | *_memory 系列（JSON / localStorage 持久化） |
| 需要网页嵌入 AI 助手 | floating_ai_widget.html（完整悬浮窗实现） |
| 需要流式输出实现 | streamResponse() 函数（SSE ReadableStream 解析） |
| 需要页面知识库 AI | extractPageContext() 函数（TreeWalker 内容提取） |

---

# 第四部分：附录

## 4.1 关键代码片段

### 4.1.1 OpenAI 兼容 SDK 统一调用模板

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.deepseek.com",   # 改这里切换厂商
    api_key="sk-xxx",                      # 改这里换 Key
)

response = client.chat.completions.create(
    model="deepseek-chat",                  # 改这里换模型
    messages=[
        {"role": "system", "content": "你是一个..."},
        {"role": "user", "content": "..."},
    ],
    stream=True,                            # 开启流式
)

# 非流式
print(response.choices[0].message.content)

# 流式
for chunk in response:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

### 4.1.2 页面内容提取器（核心）

```javascript
function extractPageContext() {
  const title = document.title;
  const meta = document.querySelector('meta[name="description"]')?.content || '';
  const headings = [...document.querySelectorAll('h1,h2,h3')]
    .filter(h => h.offsetParent)
    .map(h => '## ' + h.textContent.trim());

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p?.offsetParent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(p.tagName))
        return NodeFilter.FILTER_REJECT;
      if (p.closest('.fai-panel,.fai-trigger')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let text = '', node;
  while ((node = walker.nextNode()) && text.length < 3000)
    text += node.textContent.trim() + ' ';
  return `# 标题: ${title}\n\n# 结构:\n${headings.join('\n')}\n\n# 内容:\n${text}`;
}
```

### 4.1.3 流式 SSE 解析器

```javascript
async function* sseParser(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ') || line.slice(6) === '[DONE]') continue;
      yield JSON.parse(line.slice(6));
    }
  }
}
```

### 4.1.4 两步点击确认清除历史（替代 confirm）

```javascript
function faiClearHistory() {
  // 两步确认：首次点击变红提示，3秒内再次点击才清除（避免 confirm 弹窗崩 IDE）
  const btn = $('faiHistory').querySelector('button');
  if (btn && btn.textContent.includes('确认')) {
    // 第二次点击 → 真正清除
    historyList = [];
    messages = [{ role: 'system', content: buildSystemPrompt() }];
    messagesEl.querySelectorAll('.fai-msg, .fai-error').forEach(el => el.remove());
    emptyEl.style.display = 'flex';
    saveToStorage();
    renderHistoryPanel();
    $('faiHistory').classList.remove('show');
    inputEl.focus();
    return;
  }
  // 第一次点击 → 变红提示
  if (btn) {
    btn.textContent = '确认清除？';
    btn.style.color = '#f87171';
    btn.style.borderColor = '#6b3030';
    setTimeout(() => {
      btn.textContent = '清除历史';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 3000);
  }
}
```

## 4.2 测试用例

| 编号 | 测试项 | 输入 | 预期输出 | 验证点 |
|------|--------|------|---------|--------|
| TC01 | 页面知识问答 | 「核心产品有哪些」 | 列出 6 个产品 | 页面内容提取正确 |
| TC02 | 人物信息 | 「CTO是谁」 | 李思涵 | 团队信息提取 |
| TC03 | 角色切换 | 改昵称为「星仔」 | 回复自称星仔 | System Prompt 更新 |
| TC04 | 流式输出 | 问长问题 | 逐字出现+光标闪烁 | ReadableStream 解析 |
| TC05 | 记忆恢复 | 刷新页面重开 | 显示之前对话 | localStorage 持久化 |
| TC06 | 移动端 | 窗口缩到 400px | 面板全屏 | 媒体查询生效 |
| TC07 | 历史导出 | 导出 JSON | 下载正确 JSON | 文件内容完整 |
| TC08 | API 错误 | 错误的 Key | 红色错误提示 | 错误处理生效 |
| TC09 | ESC 关闭 | 按 ESC | 面板关闭 | 键盘事件 |
| TC10 | 空输入 | 直接点发送 | 不发送 | 输入校验 |
| TC11 | API 预注入 | 刷新页面→点开悬浮窗→直接提问 | 无需设置即可回答 | init() 预建 System Prompt |
| TC12 | 两步清除历史 | 点清除→3秒内再点确认 | 历史清空 | faiClearHistory() 交互 |
| TC13 | 字体层级可见 | 发包含加粗/代码/列表的提问 | 各文字层级颜色分明 | 气泡样式 color 显式设定 |

## 4.3 常见问题解决方案

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `Failed to fetch` | `file://` 协议无法发网络请求 | 使用 `python -m http.server` 启动 HTTP 服务器 |
| `CORS` 错误 | API 提供商不允许跨域 | 1) 用 DeepSeek（已验证允许）；2) 或用 Flask 后端代理 |
| `Missing credentials` | API Key 环境变量未设置 | 直接硬编码到代码中（本地开发），或设置 `$env:ARK_API_KEY` |
| 豆包 API 403 错误 | model 参数填了模型名 | 改为推理接入点 ID（`ep-m-xxx` 格式） |
| localStorage 满 | 历史数据超 5MB | 清除历史或升级为 IndexedDB |
| 流式输出断掉 | 中间网络中断 | 等待完整回复后刷新重试 |
| 移动端面板不显示 | 按钮被覆盖 | 检查 z-index 和页面其他 fixed 元素冲突 |
| Google Fonts 加载慢 | CDN 被墙 | 下载字体文件本地引用，或改用系统字体 |
| 清除历史页面报错 | IDE 内嵌浏览器中 `confirm()` 弹窗触发 React error #185 | 已改用两步点击确认机制（按钮变红→再点确认），不再使用原生弹窗 |
| 气泡文字看不清 | 暗色背景上默认字体颜色对比度不足 | 已为各层级显式设置 color（`#e4e0da` / `#f59e0b` / `#f0c060` / `#b4d0b4`），详见 2.2.1 字体层级表 |
