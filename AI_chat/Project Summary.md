# AI 多模型对话工具 — 项目总结文档

---

## 1. 项目概述

### 1.1 项目目的
构建一套可复用的 AI 大模型对话接入方案，支持火山引擎豆包（DouBao）和 DeepSeek 两款大语言模型。项目覆盖 CLI（命令行交互）和 Web（浏览器图形界面）两种交互形态，并提供纯前端直连与 Flask 后端代理两种架构模式，方便在不同场景下快速集成 AI 对话能力。

### 1.2 核心能力
- **多模型支持**：同时接入火山引擎方舟（豆包模型）和 DeepSeek API
- **多轮对话上下文**：通过维护 `messages` 列表实现完整会话历史追踪
- **可自定义角色**：通过 System Prompt 设定 AI 的行为模式、语气、专业领域
- **双形态交互**：CLI 终端对话 + Web 浏览器界面
- **双架构模式**：纯前端直连 + Flask 后端代理

### 1.3 适用场景
- 学习 OpenAI 兼容 API 的调用方式
- 快速搭建 ChatGPT 类聊天原型
- 为其他项目提供 AI 对话能力参考实现
- 验证纯前端调用 LLM API 的可行性

---

## 2. 项目文件结构

```
Text_1/
├── vision_test.py            # 豆包 CLI 对话助手
├── deepseek_chat.py          # DeepSeek CLI 对话助手
├── chat_frontend.html        # DeepSeek 纯前端聊天界面
├── server.py                 # Flask 后端 API 代理服务
├── templates/
│   └── index.html            # Flask + DeepSeek 完整 Web 聊天界面
└── 项目总结文档.md            # 本文档
```

---

## 3. 技术架构

### 3.1 总体架构图

```
┌──────────────────────────────────────────────────┐
│                    用户交互层                       │
│   CLI (Python 终端)          Web (浏览器 HTML)       │
└──────────┬───────────────────────┬────────────────┘
           │                       │
     ┌─────▼─────┐          ┌──────▼──────┐
     │ OpenAI SDK │          │  fetch API  │
     │ (Python)   │          │ (JavaScript)│
     └─────┬─────┘          └──────┬──────┘
           │                       │
     ┌─────▼───────────────────────▼─────┐
     │         API 调用层                  │
     │  ┌─────────────┐ ┌──────────────┐ │
     │  │ Flask 代理   │ │ 浏览器直连    │ │
     │  │ (server.py) │ │ (CORS 绕过)  │ │
     │  └──────┬──────┘ └──────┬───────┘ │
     └─────────┼───────────────┼─────────┘
               │               │
     ┌─────────▼───────────────▼─────────┐
     │         AI 模型服务层              │
     │  ┌────────────┐  ┌──────────────┐ │
     │  │  豆包(方舟) │  │  DeepSeek    │ │
     │  │ ark.cn-... │  │ api.deepseek │ │
     │  └────────────┘  └──────────────┘ │
     └───────────────────────────────────┘
```

### 3.2 架构模式对比

| 特性 | CLI 版本 | 纯前端 Web | Flask Web |
|------|----------|------------|-----------|
| **交互方式** | 终端命令行 | 浏览器页面 | 浏览器页面 |
| **API Key 安全性** | 较高（本地代码） | 低（暴露于 JS） | 高（仅存后端） |
| **部署复杂度** | 极低，装依赖即用 | 极低，双击 HTML | 中，需启动 Flask |
| **跨域处理** | 无需关注 | 依赖 API 提供商 | 后端代理，无跨域问题 |
| **生产可用性** | 仅本地开发 | 不推荐（Key 泄露风险） | 可改造上线 |

---

## 4. 核心实现细节

### 4.1 OpenAI 兼容 SDK 模式

所有对话实现均通过 Python 的 `openai` 库调用，核心调用范式：

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.deepseek.com",      # API 基础地址
    api_key="sk-xxxxxxxxxxxxxxxx",            # API 密钥
)

response = client.chat.completions.create(
    model="deepseek-chat",                     # 模型标识
    messages=[
        {"role": "system", "content": "你是一个友好的助手。"},
        {"role": "user", "content": "用户提问"},
    ],
)

reply = response.choices[0].message.content   # 提取回复内容
```

**关键参数说明：**
- `base_url`：不同服务商的基础域名，这是 OpenAI SDK 兼容生态的核心机制
- `model`：豆包需用推理接入点 ID（`ep-m-xxxx`），DeepSeek 用模型名（`deepseek-chat`）
- `messages`：对话历史数组，支持 `system` / `user` / `assistant` 三种角色

### 4.2 多轮对话上下文维护

核心机制：**在客户端维护完整的 messages 数组，每次请求将全部历史发送给 API**。

```python
messages = [{"role": "system", "content": system_prompt}]

while True:
    user_input = input("你: ")
    messages.append({"role": "user", "content": user_input})

    response = client.chat.completions.create(model=model, messages=messages)
    reply = response.choices[0].message.content

    messages.append({"role": "assistant", "content": reply})
    print(f"AI: {reply}")
```

**注意**：所有上下文管理在客户端完成，API 本身无状态。上下文越长，Token 消耗越大。

### 4.3 System Prompt 角色定制

通过在 messages 数组首位插入 `{"role": "system", "content": ...}` 来定义 AI 的行为模式：

```python
# 普通助手
system_prompt = "你是一个友好、博学、乐于助人的AI助手。"

# 角色扮演
system_prompt = "你是一个毒舌但内心温柔的猫娘，说话带'喵'结尾。"

# 专业顾问
system_prompt = "你是一个精通 Python 的编程导师，回答要附带代码示例。"
```

### 4.4 纯前端 fetch 直连

核心 JS 调用代码：

```javascript
const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
    }),
});
const data = await resp.json();
const reply = data.choices[0].message.content;
```

**纯前端方案的前提条件：**
- API 提供商未设置 CORS 限制（DeepSeek 当前已验证可行，豆包不可行）
- 用户需手动输入 API Key（或存于 localStorage）
- **安全风险**：Key 暴露在客户端 JS 中，F12 即可查看

### 4.5 Flask 后端代理模式

架构思路：前端不直接调 API，而是通过本地 Flask 服务中转，实现 Key 隔离与跨域规避。

**后端 API 设计：**

| 端点 | 方法 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| `/` | GET | — | HTML 页面 | 返回聊天界面 |
| `/api/chat` | POST | `{session_id, message, system_prompt}` | `{reply}` 或 `{error}` | 发送消息 |
| `/api/reset` | POST | `{session_id, system_prompt}` | `{status: "ok"}` | 重置会话 |

**会话管理：**

```python
sessions = {}  # key: session_id, value: messages 数组

# 创建/获取会话
if session_id not in sessions:
    sessions[session_id] = [{"role": "system", "content": system_prompt}]

# API Key 不离开后端
client = OpenAI(
    base_url="https://api.deepseek.com",
    api_key="sk-xxx",  # 仅后端存储
)
```

### 4.6 简易 Markdown 渲染

前端实现了轻量级 Markdown 转 HTML，支持 4 种语法：

```javascript
function md(text) {
    // 代码块: ```...```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
        (_, lang, code) => `<pre><code>${code.trim()}</code></pre>`);
    // 行内代码: `...`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 加粗: **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 斜体: *...*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
```

---

## 5. API 接口详情

### 5.1 火山引擎方舟（豆包）

| 配置项 | 值 |
|--------|-----|
| **基础 URL** | `https://ark.cn-beijing.volces.com/api/v3` |
| **认证方式** | API Key（`ark-xxx` 格式） |
| **Model 参数** | 推理接入点 ID（`ep-m-xxx` 格式），非模型名称 |
| **接入点管理** | 方舟控制台 → 推理接入点 → 创建 |
| **Python 依赖** | `openai`（推荐）或 `volcenginesdkarkruntime` |

### 5.2 DeepSeek

| 配置项 | 值 |
|--------|-----|
| **基础 URL** | `https://api.deepseek.com` |
| **认证方式** | API Key（`sk-xxx` 格式） |
| **Model 参数** | `deepseek-chat` |
| **API Key 获取** | https://platform.deepseek.com |
| **CORS 策略** | 已验证允许浏览器跨域调用 |

---

## 6. 环境与依赖

### 6.1 开发环境

| 项目 | 信息 |
|------|------|
| **操作系统** | Windows（PowerShell） |
| **Python 版本** | 3.14 |
| **包管理器** | pip |

### 6.2 第三方依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `openai` | latest | OpenAI SDK，兼容调用多厂商 API |
| `flask` | latest | Web 框架，仅 server.py 方案需要 |

### 6.3 前端依赖

全部为原生 HTML/CSS/JS，**无 NPM 依赖**：
- 前端字体：Google Fonts（`Noto Serif SC` + `JetBrains Mono`），仅 Flask 版本使用
- 纯前端版本使用系统默认字体

### 6.4 安装命令

```powershell
# CLI 版本和 Flask 后端共用
pip install openai

# Flask 方案额外需要
pip install flask
```

---

## 7. 运行方式

### 7.1 豆包 CLI 对话

```powershell
# 设置环境变量（可选，代码中已硬编码 Key）
$env:ARK_API_KEY = "你的豆包API Key"

python vision_test.py
```

### 7.2 DeepSeek CLI 对话

```powershell
python deepseek_chat.py
```

### 7.3 DeepSeek 纯前端 Web

```powershell
# 方式一：直接双击打开（可能受 file:// 协议安全策略限制）
start chat_frontend.html

# 方式二：通过 HTTP 服务器（推荐）
python -m http.server 8080
# 浏览器访问 http://localhost:8080/chat_frontend.html
```

### 7.4 Flask Web 完整方案

```powershell
python server.py
# 浏览器访问 http://127.0.0.1:5000
```

---

## 8. Web 界面设计规范

### 8.1 Flask 版本 (`templates/index.html`)

| 设计要素 | 规格 |
|----------|------|
| **设计风格** | 暗色奢华 · 暖金 accent |
| **字体** | Noto Serif SC（正文）+ JetBrains Mono（代码） |
| **主色调** | `--accent: #d4a574`（暖金色） |
| **背景** | `#0d0f14` + 径向渐变微光效果 |
| **圆角** | 容器 20px、气泡 16px、按钮 10px |
| **动画** | 容器入场弹性缓动、消息气泡上浮渐入、打字指示器弹跳 |
| **响应式** | 640px 断点全屏适配 |

### 8.2 纯前端版本 (`chat_frontend.html`)

| 设计要素 | 规格 |
|----------|------|
| **设计风格** | 暗色极简 · 青绿 accent |
| **字体** | System UI 栈（-apple-system / BlinkMacSystemFont） |
| **主色调** | `--accent: #10a37f`（DeepSeek 品牌绿） |
| **背景** | `#0f1117` 纯色 |
| **圆角** | 容器 16px、气泡 14px |

---

## 9. 已知限制

| 限制 | 说明 | 影响范围 |
|------|------|----------|
| **API Key 硬编码** | CLI 和 server.py 中 Key 直接写死在代码中 | 所有版本，需手动修改后重新部署 |
| **会话仅存内存** | Flask server.py 的 `sessions` 字典在进程重启后丢失 | server.py 方案 |
| **无 Token 计数** | 未计算/限制单次请求的 Token 消耗 | 所有版本，长对话可能超出模型上限 |
| **纯前端 Key 泄露** | API Key 存在 JS 变量和 localStorage，F12 可见 | chat_frontend.html |
| **无流式输出** | 所有版本均为一次性返回完整回复 | 所有版本，体验不如 ChatGPT 的逐字输出 |
| **无错误重试** | API 调用失败无自动重试机制 | 所有版本 |
| **无多会话隔离** | CLI 版本无法并行多个对话 | CLI 版本 |
| **无日志记录** | 对话历史无持久化存储 | 所有版本 |

---

## 10. 未来优化方向

### 10.1 功能增强
- **流式输出（Streaming）**：启用 `Stream=True`，实现逐字打字效果
- **对话历史持久化**：存储到 SQLite / JSON 文件，支持跨会话恢复
- **多会话管理**：支持同时维护多个对话，可切换
- **图片/文件上传**：支持视觉模型的多模态输入
- **Markdown 完整渲染**：支持表格、列表、链接、LaTeX 公式

### 10.2 安全性
- **API Key 环境变量化**：彻底移除硬编码，统一从 `.env` 文件读取
- **用户认证**：Web 版本加入登录机制，保护 API 用量
- **输入限制**：添加防滥用机制（速率限制、Token 上限）
- **HTTPS 部署**：生产环境使用 Nginx 反向代理 + SSL

### 10.3 工程化
- **Docker 容器化**：编写 Dockerfile，一键部署
- **Vite/React 重构前端**：组件化开发，更好的可维护性
- **WebSocket 通信**：替代 HTTP 轮询，实时双向通信
- **单元测试**：覆盖 API 调用、消息管理逻辑

### 10.4 扩展开源模型
- **接入 Ollama**：支持本地部署的开源模型（Llama、Qwen 等）
- **接入其他 API**：OpenAI、Claude、Gemini 等

---

## 11. 关键经验总结

### 11.1 技术决策要点

1. **统一用 `openai` SDK**：火山引擎方舟、DeepSeek 都是 OpenAI API 兼容格式，不需要各自的 SDK，一个 `openai` 库全部搞定。

2. **豆包的 `model` 参数陷阱**：火山引擎方舟要求传推理接入点 ID（如 `ep-m-20260617203435-stl6z`），而不是模型名称（如 `doubao-seed-2-0-pro-260215`）。这是最常见的配置错误。

3. **CORS 并非绝对**：DeepSeek 允许浏览器跨域直接调用，这使得纯前端方案可行。但多数 API 提供商（OpenAI、火山引擎等）有 CORS 限制，需要后端代理。

4. **System Prompt 是灵魂**：通过 `{"role": "system"}` 消息可以完全改变 AI 的行为模式，这是角色扮演、专业顾问等场景的核心机制。

### 11.2 可复用的代码模式

- **OpenAI 兼容 SDK 初始化模板**：改 `base_url` + `api_key` + `model` 即可接入任何兼容 API
- **多轮对话循环模式**：`messages` 数组维护 + `append` 历史 + 完整发送
- **纯前端 fetch 调用示例**：适用于 CORS 友好的 API（如 DeepSeek）
- **Flask 代理中间层**：通用的 API Key 隔离方案，保护密钥安全

---

## 12. 附录：快速参考卡片

### 修改 model 接入新 API

```python
# OpenAI
client = OpenAI(base_url="https://api.openai.com/v1", api_key="sk-xxx")
model = "gpt-4o"

# DeepSeek
client = OpenAI(base_url="https://api.deepseek.com", api_key="sk-xxx")
model = "deepseek-chat"

# 火山引擎/豆包
client = OpenAI(base_url="https://ark.cn-beijing.volces.com/api/v3", api_key="ark-xxx")
model = "ep-m-xxx"  # 不是模型名！
```

### 快速启动命令

```powershell
# CLI
python deepseek_chat.py

# 纯前端
python -m http.server 8080

# Flask 后端
python server.py
```
