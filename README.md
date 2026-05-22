# Creative Developer Personal Portfolio

一个现代化的个人作品集展示网站，采用黑白配色风格，具有流畅的动画效果和响应式设计。

## 项目特点

- **黑白配色方案**: 符合WCAG 2.1 AA级对比度标准，提升可读性与视觉统一性
- **流畅动画效果**: 包含开场动画、网格线条动画、粒子效果等
- **响应式设计**: 完美适配移动端(320px-480px)、平板(481px-768px)和桌面端(769px+)
- **多页面展示**: 包含个人主页、项目详情页等多个页面
- **跨浏览器兼容**: 支持Chrome 80+、Firefox 75+、Safari 13+、Edge 80+

## 技术栈

- HTML5
- CSS3 (Flexbox, Grid, CSS Variables)
- JavaScript (ES6+)
- Tailwind CSS 3

## 项目结构

```
├── index.html          # 主页面
├── style.css           # 全局样式
├── script.js           # 交互脚本
├── server.js           # 开发服务器
├── img/                # 图片资源
│   ├── Etta.png
│   ├── title.png
│   ├── QR.png
│   └── ...
├── README.md           # 项目说明
├── DEPLOYMENT_GUIDE.md # 部署指南
└── .gitignore          # Git忽略配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **打开网站**: 在浏览器中访问 `http://localhost:3000`
2. **导航浏览**: 使用顶部导航栏在不同页面间切换
3. **查看项目**: 点击作品展示区域的项目卡片查看详情
4. **联系表单**: 在联系页面填写表单发送消息

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

## 响应式断点

| 设备类型 | 宽度范围 |
|----------|----------|
| 移动端 | 320px - 480px |
| 平板 | 481px - 768px |
| 桌面 | 769px+ |

## 无障碍标准

本项目遵循 WCAG 2.1 AA 级标准：
- 文本与背景对比度 ≥ 4.5:1
- 可点击区域尺寸合适
- 支持键盘导航
- 语义化HTML结构

## 开发

### 开发规范

- 使用语义化HTML标签
- CSS变量管理颜色主题
- 使用ES6+语法
- 代码缩进使用4空格

### 自定义配置

在 `index.html` 的 `<style>` 标签中修改CSS变量来自定义配色：

```css
:root {
    --primary-gradient: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
    --text-primary: #1a1a1a;
    --text-secondary: #525252;
    /* ... */
}
```

## 部署

请参考 `DEPLOYMENT_GUIDE.md` 获取详细的部署指南。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！