# 个人作品集公网访问部署指南

## 一、快速启动

### 方式1：Node.js 服务器（推荐）

```bash
cd "d:\Frontend Learning\Code Set\Self‑Taught Code Collection\0-Personal Portfolio"

# 启动服务器（默认端口3000）
node server.js

# 自定义端口
PORT=8080 node server.js
```

### 方式2：Python 服务器

```bash
cd "d:\Frontend Learning\Code Set\Self‑Taught Code Collection\0-Personal Portfolio"

# Python 3
python -m http.server 3000

# 指定端口和IP
python -m http.server 3000 --bind 0.0.0.0
```

### 方式3：VS Code Live Server 插件（仅局域网）

如果你使用 VS Code，可以安装 Live Server 插件，但仅支持局域网访问。

---

## 二、公网访问方案

**重要提示**：大多数家庭网络没有公网IP，且在路由器后面，需要使用内网穿透工具。

### 方案1：ngrok（最简单，推荐）

1. 下载 ngrok: https://ngrok.com/download

2. 注册账号并获取 authtoken

3. 配置 token:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

4. 启动你的服务器:
   ```bash
   node server.js
   ```

5. 在另一个终端启动 ngrok:
   ```bash
   ngrok http 3000
   ```

6. 复制显示的公网地址（如 `https://xxxx.ngrok.io`）即可访问

**优点**: 无需公网IP，免费额度足够个人使用，设置简单
**缺点**: 免费版每次重启会变换URL，有带宽限制

---

### 方案2：frp（内网穿透，自建服务器）

适用于有云服务器的用户

#### 1. 在有公网IP的云服务器上部署 frps

下载 frp: https://github.com/fatedier/frp/releases

**frps.ini 配置:**
```ini
[common]
bind_port = 7000
vhost_http_port = 8080
```

启动:
```bash
./frps -c ./frps.ini
```

#### 2. 在本机部署 frpc

**frpc.ini 配置:**
```ini
[common]
server_addr = 你的云服务器IP
server_port = 7000

[web]
type = http
local_ip = 127.0.0.1
local_port = 3000
custom_domains = 你的域名或服务器IP
```

启动:
```bash
# 先启动你的服务器
node server.js

# 再启动frpc
./frpc -c ./frpc.ini
```

访问: `http://你的云服务器IP:8080`

---

### 方案3：花生壳（国内工具）

1. 下载花生壳客户端: https://hsk.oray.com/download/
2. 安装并登录
3. 添加映射：
   - 内网主机: 127.0.0.1
   - 内网端口: 3000
   - 外网端口: 按需选择
4. 获取外网访问地址

---

### 方案4：Cloudflare Tunnel（免费，无需公网IP）

1. 安装 cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

2. 登录 Cloudflare 账号:
   ```bash
   cloudflared tunnel login
   ```

3. 创建隧道:
   ```bash
   cloudflared tunnel create my-portfolio
   ```

4. 配置文件 `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <你的隧道ID>
   credentials-file: /path/to/credentials.json

   ingress:
     - hostname: my-portfolio.example.com
       service: http://localhost:3000
     - service: http_status:404
   ```

5. 启动:
   ```bash
   # 先启动服务器
   node server.js

   # 再启动隧道
   cloudflared tunnel run my-portfolio
   ```

6. 访问: `https://my-portfolio.example.com`

---

## 三、防火墙配置（Windows）

### Windows Defender 防火墙

1. 打开 "Windows Defender 防火墙"

2. 点击 "高级设置"

3. 选择 "入站规则" → "新建规则"

4. 规则类型: "端口" → 下一步

5. 特定本地端口: `3000`（或你使用的端口）→ 下一步

6. 操作: "允许连接" → 下一步

7. 配置文件: 全部勾选 → 下一步

8. 名称: `个人作品集-3000` → 完成

### 测试防火墙是否生效

```powershell
# 检查端口是否监听
netstat -an | findstr "3000"

# 应该显示:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING
```

---

## 四、路由器端口转发（适用于有公网IP的用户）

如果你有公网IP（联系你的网络运营商申请），可以设置端口转发：

1. 登录路由器管理界面（通常地址: 192.168.0.1 或 192.168.1.1）

2. 找到 "端口转发" / "虚拟服务器" / "NAT转发"

3. 添加规则:
   - 外部端口: 3000（或你想使用的端口）
   - 内部IP地址: 你的电脑IP（如 192.168.1.100）
   - 内部端口: 3000
   - 协议: TCP

4. 保存并重启路由器

5. 现在可以通过 `http://你的公网IP:3000` 访问

### 查看公网IP

```powershell
# 方法1
curl ifconfig.me

# 方法2
Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing
```

---

## 五、测试访问

### 本地测试
- 浏览器打开: `http://localhost:3000`
- 或: `http://127.0.0.1:3000`

### 局域网测试
- 找到本机IP:
  ```powershell
  ipconfig
  ```
- 在同一局域网的其他设备上打开: `http://192.168.x.x:3000`

### 公网测试
- 使用手机4G/5G网络或其他网络
- 打开 ngrok 提供的公网地址
- 或打开 `http://你的公网IP:端口`

---

## 六、关闭服务的方法

### 正常关闭

1. **在运行服务器终端按**: `Ctrl + C`

2. 或打开新终端执行:
   ```powershell
   # 查找进程
   netstat -ano | findstr ":3000"

   # 关闭进程（假设PID是12345）
   taskkill /PID 12345 /F
   ```

### 关闭 ngrok

- 在 ngrok 终端按 `Ctrl + C`
- 或:
  ```powershell
  taskkill /IM ngrok.exe /F
  ```

### 彻底清理

关闭所有服务后，可以检查是否有残留进程：

```powershell
# 检查node进程
tasklist | findstr node

# 关闭所有node进程
taskkill /IM node.exe /F
```

---

## 七、开机自启设置（可选）

如果你希望服务器开机自动运行：

### 使用 Windows 任务计划程序

1. 打开 "任务计划程序"

2. 创建基本任务

3. 设置触发器: 计算机启动

4. 操作: 启动程序
   - 程序: `node.exe`
   - 参数: `server.js`
   - 起始位置: `d:\Frontend Learning\Code Set\Self‑Taught Code Collection\0-Personal Portfolio`

---

## 八、安全建议

1. **仅用于演示**: 本方案适合临时演示，不建议长期公网暴露
2. **定期关闭**: 演示完成后及时关闭服务
3. **敏感信息**: 确保网站没有泄露敏感信息
4. **HTTPS**: 生产环境建议使用 HTTPS，可通过 nginx 反向代理实现
5. **访问日志**: 定期检查服务器日志，发现异常访问

---

## 九、故障排除

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | 更换端口: `PORT=8080 node server.js` |
| 无法访问 | 检查防火墙规则 |
| ngrok 502错误 | 检查本地服务器是否正常运行 |
| 域名解析失败 | 检查DNS配置或使用IP直接访问 |
| 浏览器显示不安全 | 使用HTTPS或忽略证书警告（测试用）|

---

## 十、快速命令汇总

```powershell
# 1. 启动服务器
cd "d:\Frontend Learning\Code Set\Self‑Taught Code Collection\0-Personal Portfolio"
node server.js

# 2. 另开终端，启动ngrok（需要先安装配置）
ngrok http 3000

# 3. 查看本机IP
ipconfig

# 4. 查看公网IP
curl ifconfig.me

# 5. 强制关闭端口3000的进程
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /PID %a /F
```

---

如需进一步帮助或遇到问题，随时告诉我~