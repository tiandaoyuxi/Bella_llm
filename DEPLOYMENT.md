# 🌸 贝拉项目部署指南

## 📦 打包部署

### 方案一：静态文件部署（推荐）

#### 1. 构建静态文件
```bash
node build-static.js
```

这将创建一个 `dist` 目录，包含所有需要的静态文件。

#### 2. 部署到Web服务器

**IIS部署：**
1. 将 `dist` 目录内容复制到IIS网站根目录
2. 确保已安装 `.NET Framework` 或 `.NET Core`
3. `web.config` 文件已自动生成，支持SPA路由

**Apache部署：**
1. 将 `dist` 目录内容复制到Apache网站根目录
2. 创建 `.htaccess` 文件：
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 设置MIME类型
AddType image/webp .webp
AddType video/mp4 .mp4
AddType application/json .json
```

**Nginx部署：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(webp|mp4|json)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. 配置API地址

编辑 `dist/config.json` 文件：
```json
{
  "apiBaseUrl": "http://your-api-server:3002",
  "version": "1.0.0",
  "buildTime": "2025-07-21T..."
}
```

### 方案二：完整部署（包含后端）

#### 1. 服务器要求
- Node.js 16+ 
- Python 3.8+ (用于CosyVoice)
- Ollama服务

#### 2. 部署步骤

**后端部署：**
```bash
# 安装依赖
npm install

# 启动服务器
node server.js
```

**前端部署：**
- 将静态文件部署到Web服务器
- 配置反向代理到Node.js服务器

**Nginx反向代理配置：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 配置说明

### 环境变量
```bash
# API服务器配置
OLLAMA_HOST=http://1.119.154.173:11343
TTS_HOST=http://1.119.154.173:9880
SERVER_PORT=3002

# 前端配置
API_BASE_URL=http://localhost:3002
```

### 服务依赖

1. **Ollama服务** (端口11343)
   - 用于LLM对话功能
   - 需要预先下载模型

2. **CosyVoice服务** (端口9880)
   - 用于TTS语音合成
   - 需要预训练模型文件

3. **Node.js API服务** (端口3002)
   - 提供聊天和TTS接口
   - 连接Ollama和CosyVoice

## 📁 文件结构

```
dist/
├── index.html              # 主页面
├── script-production.js    # 生产环境JS
├── style.css              # 样式文件
├── config.json            # 配置文件
├── web.config             # IIS配置
├── Bellaicon/             # 图标资源
├── 视频资源/               # 视频文件
└── package.json           # 项目信息
```

## 🚀 性能优化

### 1. 资源优化
- 视频文件压缩
- 图片格式优化（WebP）
- JavaScript代码压缩

### 2. 缓存策略
- 静态资源长期缓存
- API响应适当缓存
- 浏览器缓存配置

### 3. CDN部署
- 静态资源使用CDN
- 视频文件CDN加速
- 全球节点分发

## 🔒 安全配置

### 1. HTTPS配置
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # SSL配置...
}
```

### 2. CORS配置
```javascript
// server.js
app.use(cors({
    origin: ['https://your-domain.com'],
    credentials: true
}));
```

### 3. 安全头设置
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

## 📊 监控和日志

### 1. 服务监控
- API服务健康检查
- Ollama服务状态监控
- TTS服务可用性检查

### 2. 日志配置
```javascript
// 生产环境日志
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

## 🐛 故障排除

### 常见问题

1. **API连接失败**
   - 检查config.json中的apiBaseUrl
   - 确认后端服务正在运行
   - 检查防火墙和端口配置

2. **TTS功能不工作**
   - 确认CosyVoice服务运行状态
   - 检查音色文件是否存在
   - 查看浏览器控制台错误

3. **视频播放问题**
   - 检查视频文件路径
   - 确认浏览器支持视频格式
   - 检查MIME类型配置

### 日志查看
```bash
# Node.js服务日志
tail -f combined.log

# Nginx访问日志
tail -f /var/log/nginx/access.log

# 系统日志
journalctl -u your-service -f
```

## 📞 技术支持

如有部署问题，请检查：
1. 服务器环境配置
2. 依赖服务状态
3. 网络连接情况
4. 日志错误信息

---

🌸 祝你部署顺利！贝拉期待与更多用户见面！