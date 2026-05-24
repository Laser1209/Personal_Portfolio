# 个人作品集 - 项目实现代码

本目录包含全部 portfolio 项目的前端代码实现，每个项目均采用统一的现代化开发体系：
**Webpack 5 打包 + Babel 转译 + ESLint 规范 + Jest 单元测试**

---

## 项目列表

| 项目 | 目录 | 端口 | 描述 | 测试 | 构建 |
|------|------|------|------|------|------|
| 贪吃蛇 | `snake/` | 3001 | Canvas经典贪吃蛇，键盘+触屏操作，LocalStorage最高分 | 7/7 ✅ | ✅ |
| 五子棋 | `gobang/` | 3002 | 15×15标准棋盘，双人对战，悔棋功能，粒子效果棋子 | 10/10 ✅ | ✅ |
| 扫雷 | `minesweeper/` | 3003 | 三种难度(9×9/16×16/16×30)，右键插旗，数字颜色映射 | 6/6 ✅ | ✅ |
| 蜘蛛纸牌 | `spider-solitaire/` | 3004 | 经典蜘蛛纸牌，点击选牌移牌，得分系统，通关检测 | 8/8 ✅ | ✅ |
| 跳一跳 | `threeKills/` | 3005 | 蓄力跳跃机制，Canvas物理引擎，中心方块加分 | 7/7 ✅ | ✅ |
| 魂斗罗 | `contra/` | 3006 | 横版射击，多类型敌军，子弹碰撞检测，粒子爆炸特效 | 6/6 ✅ | ✅ |
| QQ音乐 | `qq-music/` | 3007 | 仿PC界面播放器，播放列表，歌词滚动，旋转唱片封面 | 8/8 ✅ | ✅ |

> **全部 7 个项目，共 52 个测试用例全部通过，构建全部成功。**

---

## 快速开始

```bash
# 1. 进入任意项目目录
cd program/snake

# 2. 安装依赖
npm install

# 3. 启动开发服务器（自动打开浏览器）
npm start
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动 webpack-dev-server（热更新） |
| `npm run build` | 生产模式打包，输出到 dist/ 目录 |
| `npm test` | 运行 Jest 单元测试 |
| `npm run lint` | ESLint 代码质量检查 |

## 技术栈

- **JavaScript ES6+** — 类、模块化、箭头函数、解构等现代语法
- **Canvas API** — 2D 游戏渲染核心
- **Webpack 5** — 模块打包与开发服务器
- **Babel 7** — ES6+ 语法转译兼容
- **ESLint 8** — 代码规范检查
- **Jest 29** — 单元测试框架

## 统一目录结构

```
project/
├── src/
│   ├── index.html      # HTML 模板
│   ├── index.js        # 入口逻辑 + DOM 交互
│   ├── game.js         # 核心游戏/业务逻辑（纯逻辑，无DOM依赖）
│   └── styles.css      # 样式文件
├── test/
│   └── *.test.js       # Jest 单元测试
├── babel.config.js     # Babel 转译配置
├── package.json        # 依赖管理 + 脚本
├── webpack.config.js   # 构建配置
├── .eslintrc.js        # ESLint 规则
└── .gitignore          # Git 忽略规则
```

## 注意事项

- 所有项目采用 `babel-jest` 转换 ES Module，确保测试环境兼容
- 涉及 `localStorage` 的项目使用 `safeStorage` 包装器兼容 Node.js 测试环境
- 浏览器 API（Canvas、requestAnimationFrame 等）在测试中通过 Jest mock 模拟
- 各项目端口互不冲突（3001-3007），可同时启动多个开发服务器
